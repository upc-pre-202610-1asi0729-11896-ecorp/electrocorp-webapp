import { computed, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { BillingFacade } from '../../../billing/application/services/billing.facade';
import { PlanPermissionService } from '../../../billing/domain/services/plan-permission.service';

import { EnergyReading } from '../../domain/model/energy-reading.entity';
import { EnergyRecommendationService } from '../../domain/services/energy-recommendation.service';
import { ExportEnergyReadingsCommand } from '../commands/export-energy-readings.command';
import { FilterReadingsDto } from '../dtos/filter-readings.dto';
import { ReadingsApiService } from '../../infrastructure/api/readings-api.service';
import { EnergyReadingAssembler } from '../../infrastructure/assemblers/energy-reading.assembler';

@Injectable({
  providedIn: 'root',
})
export class EnergyMonitoringFacade {
  private readonly assembler = new EnergyReadingAssembler();

  private readonly allReadingsSignal = signal<EnergyReading[]>([]);
  private readonly readingsSignal = signal<EnergyReading[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly readings = computed(() => this.readingsSignal());
  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  readonly totalWatts = computed(() =>
    this.readingsSignal().reduce((total, reading) => total + reading.watts, 0)
  );

  readonly averageWatts = computed(() => {
    const readings = this.readingsSignal();

    if (readings.length === 0) return 0;

    return Math.round(
      readings.reduce((total, reading) => total + reading.watts, 0) /
      readings.length
    );
  });

  readonly highestReading = computed(() => {
    const watts = this.readingsSignal().map((reading) => reading.watts);
    return watts.length > 0 ? Math.max(...watts) : 0;
  });

  readonly recommendationKey = computed(() =>
    this.recommendationService.generateRecommendation(this.readingsSignal())
  );

  constructor(
    private readonly readingsApi: ReadingsApiService,
    private readonly recommendationService: EnergyRecommendationService,
    private readonly billingFacade: BillingFacade,
    private readonly planPermissionService: PlanPermissionService
  ) {}

  async loadReadings(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const responses = await firstValueFrom(this.readingsApi.findAll());
      const readings = responses.map((response) =>
        this.assembler.toEntity(response)
      );

      this.allReadingsSignal.set(readings);
      this.readingsSignal.set(readings);
    } catch (error) {
      console.error(error);
      this.errorSignal.set('energy.loadError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  filterReadings(payload: FilterReadingsDto): void {
    if (!payload.startDate || !payload.endDate) {
      this.readingsSignal.set(this.allReadingsSignal());
      return;
    }

    const start = new Date(payload.startDate);
    const end = new Date(payload.endDate);

    const filtered = this.allReadingsSignal().filter((reading) => {
      const recordedAt = new Date(reading.recordedAt);
      return recordedAt >= start && recordedAt <= end;
    });

    this.readingsSignal.set(filtered);
  }

  resetFilter(): void {
    this.readingsSignal.set(this.allReadingsSignal());
  }

  async exportCsv(
    command: ExportEnergyReadingsCommand = {
      fileName: 'electrocorp-energy-readings.csv',
    }
  ): Promise<boolean> {
    await this.billingFacade.loadBilling();

    const activePlanCode = this.billingFacade.activePlanCode();

    const canExportCsv = this.planPermissionService.canExportCsv(activePlanCode);

    if (!canExportCsv) {
      this.errorSignal.set('energy.exportNotAllowed');
      return false;
    }

    const readings = command.readings ?? this.readingsSignal();

    if (readings.length === 0) {
      this.errorSignal.set('energy.emptyReadings');
      return false;
    }

    const rows = [
      ['Device', 'Watts', 'Date', 'Status'],
      ...readings.map((reading) => [
        reading.deviceName,
        String(reading.watts),
        reading.recordedAt,
        reading.status,
      ]),
    ];

    const csvContent = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = command.fileName.endsWith('.csv')
      ? command.fileName
      : `${command.fileName}.csv`;
    anchor.click();

    URL.revokeObjectURL(url);
    return true;
  }
}
