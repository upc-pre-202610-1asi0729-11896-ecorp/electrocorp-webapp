import { computed, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthSessionService } from '../../../shared/application/services/auth-session.service';

import { CreateConsumptionReportCommand } from '../commands/create-consumption-report.command';
import { GenerateConsumptionReportDto } from '../dtos/generate-consumption-report.dto';
import { CreateEnergyGoalDto } from '../dtos/create-energy-goal.dto';

import { ConsumptionReport } from '../../domain/model/consumption-report.entity';
import { EnergyGoal } from '../../domain/model/energy-goal.entity';
import { ReportSummaryService } from '../../domain/services/report-summary.service';

import { ConsumptionReportsApiService } from '../../infrastructure/api/consumption-reports-api.service';
import { EnergyGoalsApiService } from '../../infrastructure/api/energy-goals-api.service';
import { ReadingsApiService } from '../../../energy-monitoring/infrastructure/api/readings-api.service';

import { ConsumptionReportAssembler } from '../../infrastructure/assemblers/consumption-report.assembler';
import { EnergyGoalAssembler } from '../../infrastructure/assemblers/energy-goal.assembler';

@Injectable({
  providedIn: 'root',
})
export class ReportingFacade {
  private readonly consumptionReportAssembler = new ConsumptionReportAssembler();
  private readonly energyGoalAssembler = new EnergyGoalAssembler();

  private readonly reportsSignal = signal<ConsumptionReport[]>([]);
  private readonly goalsSignal = signal<EnergyGoal[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly reports = computed(() => this.reportsSignal());
  readonly goals = computed(() => this.goalsSignal());
  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  readonly reportsSorted = computed(() =>
    [...this.reportsSignal()].sort((a, b) => b.totalWatts - a.totalWatts)
  );

  readonly goalsSorted = computed(() => {
    const statusPriority: Record<string, number> = {
      IN_PROGRESS: 1,
      COMPLETED: 2,
      FAILED: 3,
    };

    return [...this.goalsSignal()].sort((a, b) => {
      const byStatus = statusPriority[a.status] - statusPriority[b.status];

      if (byStatus !== 0) {
        return byStatus;
      }

      return b.progressPercentage - a.progressPercentage;
    });
  });

  readonly totalReports = computed(() => this.reportsSignal().length);
  readonly totalGoals = computed(() => this.goalsSignal().length);

  readonly totalWattsReported = computed(() =>
    this.reportSummaryService.calculateTotalReportedWatts(this.reportsSignal())
  );

  readonly highestReading = computed(() => {
    const reports = this.reportsSignal();

    if (!reports.length) {
      return 0;
    }

    return Math.max(...reports.map((report) => report.highestReading));
  });

  readonly averageReportWatts = computed(() => {
    const reports = this.reportsSignal();

    if (!reports.length) {
      return 0;
    }

    return Math.round(
      this.reportSummaryService.calculateAverageReportedWatts(reports)
    );
  });

  readonly criticalReports = computed(
    () =>
      this.reportsSignal().filter((report) => report.highestReading >= 1000)
        .length
  );

  readonly strongestReport = computed(() => {
    return this.reportSummaryService.findHighestReport(this.reportsSignal());
  });

  readonly maxReportTotalWatts = computed(() => {
    const reports = this.reportsSignal();

    if (!reports.length) {
      return 1;
    }

    return Math.max(...reports.map((report) => report.totalWatts), 1);
  });

  readonly averageGoalProgress = computed(() => {
    const goals = this.goalsSignal();

    if (!goals.length) {
      return 0;
    }

    const totalProgress = goals.reduce(
      (total, goal) => total + goal.progressPercentage,
      0
    );

    return Math.round(totalProgress / goals.length);
  });

  readonly activeGoals = computed(() =>
    this.goalsSignal().filter((goal) => goal.status === 'IN_PROGRESS')
  );

  readonly completedGoals = computed(() =>
    this.goalsSignal().filter((goal) => goal.status === 'COMPLETED')
  );

  readonly failedGoals = computed(() =>
    this.goalsSignal().filter((goal) => goal.status === 'FAILED')
  );

  readonly averageRemainingWatts = computed(() => {
    const goals = this.goalsSignal();

    if (!goals.length) {
      return 0;
    }

    const total = goals.reduce((sum, goal) => sum + goal.remainingWatts, 0);

    return Math.round(total / goals.length);
  });

  readonly bestGoal = computed(() => {
    const goals = this.goalsSorted();

    return goals.length ? goals[0] : null;
  });

  constructor(
    private readonly consumptionReportsApi: ConsumptionReportsApiService,
    private readonly energyGoalsApi: EnergyGoalsApiService,
    private readonly readingsApi: ReadingsApiService,
    private readonly authSession: AuthSessionService,
    private readonly reportSummaryService: ReportSummaryService
  ) {}

  async loadReports(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const userId = this.getCurrentUserId();

      const responses = await firstValueFrom(
        this.consumptionReportsApi.findByUserId(userId)
      );

      this.reportsSignal.set(
        responses.map((response) =>
          this.consumptionReportAssembler.toEntity(response)
        )
      );
    } catch (error) {
      console.error(error);
      this.errorSignal.set('reporting.loadReportsError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async loadGoals(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const userId = this.getCurrentUserId();

      const responses = await firstValueFrom(
        this.energyGoalsApi.findByUserId(userId)
      );

      this.goalsSignal.set(
        responses.map((response) => this.energyGoalAssembler.toEntity(response))
      );
    } catch (error) {
      console.error(error);
      this.errorSignal.set('reporting.loadGoalsError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async createConsumptionReport(
    command: CreateConsumptionReportCommand
  ): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const userId = this.getCurrentUserId();
      const title = command.title.trim();
      const today = new Date().toISOString().slice(0, 10);

      if (!title || !command.startDate || !command.endDate) {
        this.errorSignal.set('reporting.invalidReportDateRange');
        return false;
      }

      if (command.startDate > command.endDate) {
        this.errorSignal.set('reporting.invalidReportDateRange');
        return false;
      }

      const response = await firstValueFrom(
        this.consumptionReportsApi.create({
          userId,
          title,
          period: command.period,
          startDate: command.startDate,
          endDate: command.endDate,
          totalWatts: 0,
          averageWatts: 0,
          highestWatts: 0,
          highestReading: 0,
          recommendation: this.buildRecommendation(0, 0, 0),
          generatedAt: today,
        })
      );

      const report = this.consumptionReportAssembler.toEntity(response);
      this.reportsSignal.update((reports) => [report, ...reports]);

      return true;
    } catch (error) {
      console.error(error);
      this.errorSignal.set('reporting.createReportError');
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async generateConsumptionReport(
    payload: GenerateConsumptionReportDto
  ): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const userId = this.getCurrentUserId();
      const today = new Date().toISOString().slice(0, 10);

      if (!payload.startDate || !payload.endDate) {
        this.errorSignal.set('reporting.invalidReportDateRange');
        return;
      }

      if (payload.startDate > payload.endDate) {
        this.errorSignal.set('reporting.invalidReportDateRange');
        return;
      }

      if (payload.endDate > today) {
        this.errorSignal.set('reporting.futureReportDateError');
        return;
      }

      const readings = await firstValueFrom(
        this.readingsApi.findByDateRange(payload.startDate, payload.endDate)
      );

      if (!readings.length) {
        this.errorSignal.set('reporting.noReadingsForReport');
        return;
      }

      const totalWatts = readings.reduce(
        (total, reading) => total + Number(reading.watts),
        0
      );

      const averageWatts = Math.round(totalWatts / readings.length);

      const highestReading = Math.max(
        ...readings.map((reading) => Number(reading.watts))
      );

      const recommendation = this.buildRecommendation(
        averageWatts,
        highestReading,
        readings.length
      );

      await firstValueFrom(
        this.consumptionReportsApi.create({
          userId,
          startDate: payload.startDate,
          endDate: payload.endDate,
          totalWatts,
          averageWatts,
          highestReading,
          recommendation,
        })
      );

      await this.loadReports();
    } catch (error) {
      console.error(error);
      this.errorSignal.set('reporting.generateReportError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async createEnergyGoal(payload: CreateEnergyGoalDto): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const userId = this.getCurrentUserId();
      const targetWatts = Number(payload.targetWatts);
      const currentWatts = Number(payload.currentWatts);

      await firstValueFrom(
        this.energyGoalsApi.create({
          userId,
          title: payload.title,
          targetWatts,
          currentWatts,
          startDate: payload.startDate,
          endDate: payload.endDate,
          status: currentWatts >= targetWatts ? 'COMPLETED' : 'IN_PROGRESS',
        })
      );

      await this.loadGoals();
    } catch (error) {
      console.error(error);
      this.errorSignal.set('reporting.createGoalError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  private buildRecommendation(
    averageWatts: number,
    highestReading: number,
    readingsCount: number
  ): string {
    if (!readingsCount) {
      return 'No energy readings were found for the selected period.';
    }

    if (highestReading >= 1000) {
      return 'Critical consumption peak detected. Review high-power devices and adjust automation routines.';
    }

    if (averageWatts >= 500) {
      return 'Consumption is above the expected range. Consider reducing usage during peak hours.';
    }

    if (averageWatts >= 120) {
      return 'Consumption is moderate. Monitor frequent devices and reduce standby usage.';
    }

    return 'Consumption is stable. Keep monitoring routines and standby energy usage.';
  }

  private getCurrentUserId(): number {
    const userId = this.authSession.userId();

    if (!userId) {
      throw new Error('Authenticated user id was not found.');
    }

    return userId;
  }
}
