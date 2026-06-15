import { computed, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { BillingFacade } from '../../../billing/application/services/billing.facade';
import { PlanPermissionService } from '../../../billing/domain/services/plan-permission.service';

import { Alert } from '../../domain/model/alert.entity';
import { AlertRule } from '../../domain/model/alert-rule.entity';
import { CreateAlertRuleCommand } from '../commands/create-alert-rule.command';
import { CreateAlertCommand } from '../commands/create-alert.command';
import { MarkAlertAsReadCommand } from '../commands/mark-alert-as-read.command';
import { UpdateAlertRuleStatusCommand } from '../commands/update-alert-rule-status.command';
import { CreateAlertDto } from '../dtos/create-alert.dto';
import { AlertRulesApiService } from '../../infrastructure/api/alert-rules-api.service';
import { AlertsApiService } from '../../infrastructure/api/alerts-api.service';
import { AlertRuleAssembler } from '../../infrastructure/assemblers/alert-rule.assembler';
import { AlertAssembler } from '../../infrastructure/assemblers/alert.assembler';
import { AlertPriorityService } from '../../domain/services/alert-priority.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationsFacade {
  private readonly alertAssembler = new AlertAssembler();
  private readonly alertRuleAssembler = new AlertRuleAssembler();

  private readonly alertsSignal = signal<Alert[]>([]);
  private readonly alertRulesSignal = signal<AlertRule[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly alerts = computed(() => this.alertsSignal());
  readonly alertRules = computed(() => this.alertRulesSignal());
  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  readonly unreadCount = computed(
    () => this.alertsSignal().filter((alert) => alert.unread).length
  );

  readonly sortedAlerts = computed(() =>
    this.alertPriorityService.sortByPriorityAndDate(this.alertsSignal())
  );

  readonly enabledAlertRules = computed(() =>
    this.alertRulesSignal().filter((rule) => rule.isEnabled)
  );

  async loadAlerts(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const responses = await firstValueFrom(this.alertsApi.findAll());

      this.alertsSignal.set(
        responses.map((response) => this.alertAssembler.toEntity(response))
      );
    } catch (error) {
      console.error(error);
      this.errorSignal.set('alerts.loadError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async createAlert(payload: CreateAlertDto | CreateAlertCommand): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await this.billingFacade.loadBilling();

      const activePlanCode = this.billingFacade.activePlanCode();

      const canCreateAlert = this.planPermissionService.canCreateManualAlert(
        activePlanCode,
        this.alertsSignal().length
      );

      if (!canCreateAlert) {
        this.errorSignal.set('alerts.planLimitReached');
        return false;
      }

      const response = await firstValueFrom(
        this.alertsApi.createAlert({
          title: payload.title,
          message: payload.message,
          level: payload.level,
          sourceType: 'sourceType' in payload ? payload.sourceType ?? 'SYSTEM' : 'SYSTEM',
          sourceId: 'sourceId' in payload ? payload.sourceId ?? null : null,
          sourceLabel: 'sourceLabel' in payload ? payload.sourceLabel ?? null : null,
          eventType: 'eventType' in payload ? payload.eventType ?? 'MANUAL' : 'MANUAL',
          threadKey: 'threadKey' in payload ? payload.threadKey : undefined,
          evidence: 'evidence' in payload ? payload.evidence ?? null : null,
          explanation: 'explanation' in payload ? payload.explanation ?? null : null,
          recommendedAction:
            'recommendedAction' in payload
              ? payload.recommendedAction ?? null
              : null,
          severityScore: 'severityScore' in payload ? payload.severityScore : undefined,
          expiresAt: 'expiresAt' in payload ? payload.expiresAt ?? null : null,
          createdAt: new Date().toISOString().slice(0, 10),
          read: false,
        })
      );

      const createdAlert = this.alertAssembler.toEntity(response);

      this.alertsSignal.set([createdAlert, ...this.alertsSignal()]);
      return true;
    } catch (error) {
      console.error(error);
      this.errorSignal.set('alerts.createError');
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async markAsRead(payload: MarkAlertAsReadCommand): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.alertsApi.markAsRead(payload.alertId)
      );

      const updatedAlert = this.alertAssembler.toEntity(response);

      this.alertsSignal.set(
        this.alertsSignal().map((alert) =>
          alert.id === payload.alertId ? updatedAlert : alert
        )
      );
      return true;
    } catch (error) {
      console.error(error);
      this.errorSignal.set('alerts.markAsReadError');
      return false;
    }
  }

  async loadAlertRules(): Promise<void> {
    try {
      const responses = await firstValueFrom(
        this.alertRulesApi.findAllForCurrentUser()
      );

      this.alertRulesSignal.set(
        responses.map((response) => this.alertRuleAssembler.toEntity(response))
      );
    } catch (error) {
      console.error(error);
      this.errorSignal.set('alertRules.loadError');
    }
  }

  async createAlertRule(
    command: CreateAlertRuleCommand
  ): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      if (!command.name.trim() || command.threshold <= 0) {
        this.errorSignal.set('alertRules.createError');
        return false;
      }

      const response = await firstValueFrom(
        this.alertRulesApi.create({
          name: command.name.trim(),
          metric: command.metric,
          conditionType: command.condition,
          threshold: Number(command.threshold),
          level: command.level,
          scopeType: command.scopeType ?? 'GENERAL',
          scopeId: command.scopeId ?? null,
          evaluatorType: command.evaluatorType ?? 'ACTIVE_POWER',
          weight: command.weight ?? 10,
          profileName: command.profileName ?? 'General',
        })
      );

      const alertRule = this.alertRuleAssembler.toEntity(response);
      this.alertRulesSignal.set([alertRule, ...this.alertRulesSignal()]);
      return true;
    } catch (error) {
      console.error(error);
      this.errorSignal.set('alertRules.createError');
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async updateAlertRuleStatus(
    command: UpdateAlertRuleStatusCommand
  ): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const response = await firstValueFrom(
        this.alertRulesApi.toggle(command.alertRuleId)
      );

      const updatedRule = this.alertRuleAssembler.toEntity(response);

      this.alertRulesSignal.set(
        this.alertRulesSignal().map((rule) =>
          rule.id === command.alertRuleId ? updatedRule : rule
        )
      );

      return true;
    } catch (error) {
      console.error(error);
      this.errorSignal.set('alertRules.updateError');
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  constructor(
    private readonly alertsApi: AlertsApiService,
    private readonly alertRulesApi: AlertRulesApiService,
    private readonly alertPriorityService: AlertPriorityService,
    private readonly billingFacade: BillingFacade,
    private readonly planPermissionService: PlanPermissionService
  ) {}
}
