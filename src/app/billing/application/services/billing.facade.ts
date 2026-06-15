import { computed, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthSessionService } from '../../../shared/application/services/auth-session.service';

import { Plan, PlanCode } from '../../domain/model/plan.entity';
import { Subscription } from '../../domain/model/subscription.entity';

import { PaymentFormCommand } from '../commands/payment-form.command';
import { SubscribeDto } from '../dtos/subscribe.dto';
import { CancelSubscriptionDto } from '../dtos/cancel-subscription.dto';
import { ProcessPaymentDto } from '../dtos/process-payment.dto';

import { PlansApiService } from '../../infrastructure/api/plans-api.service';
import { SubscriptionsApiService } from '../../infrastructure/api/subscriptions-api.service';
import { PaymentsApiService } from '../../infrastructure/api/payments-api.service';

import { PlanAssembler } from '../../infrastructure/assemblers/plan.assembler';
import { SubscriptionAssembler } from '../../infrastructure/assemblers/subscription.assembler';
import { PaymentAssembler } from '../../infrastructure/assemblers/payment.assembler';

import { SubscriptionPolicyService } from '../../domain/services/subscription-policy.service';
import { PaymentValidationService } from '../../domain/services/payment-validation.service';
import { Payment } from '../../domain/model/payment.entity';

@Injectable({
  providedIn: 'root',
})
export class BillingFacade {
  private readonly planAssembler = new PlanAssembler();
  private readonly subscriptionAssembler = new SubscriptionAssembler();
  private readonly paymentAssembler = new PaymentAssembler();

  private readonly plansSignal = signal<Plan[]>([]);
  private readonly activeSubscriptionSignal = signal<Subscription | null>(null);
  private readonly lastPaymentSignal = signal<Payment | null>(null);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly plans = computed(() => this.plansSignal());
  readonly activeSubscription = computed(() => this.activeSubscriptionSignal());
  readonly lastPayment = computed(() => this.lastPaymentSignal());
  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  readonly activePlanCode = computed<PlanCode | null>(() => {
    const subscription = this.activeSubscriptionSignal();
    return subscription?.isActive ? subscription.planCode : null;
  });

  readonly activePlan = computed<Plan | null>(() => {
    const activeCode = this.activePlanCode();

    if (!activeCode) return null;

    return this.plansSignal().find((plan) => plan.code === activeCode) ?? null;
  });

  readonly hasActiveSubscription = computed(
    () => this.activeSubscriptionSignal()?.isActive ?? false
  );

  constructor(
    private readonly plansApi: PlansApiService,
    private readonly subscriptionsApi: SubscriptionsApiService,
    private readonly paymentsApi: PaymentsApiService,
    private readonly subscriptionPolicyService: SubscriptionPolicyService,
    private readonly paymentValidationService: PaymentValidationService,
    private readonly authSession: AuthSessionService
  ) {}

  async loadBilling(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await Promise.all([
        this.loadPlans(),
        this.loadActiveSubscription(),
        this.loadLastPayment(),
      ]);
    } catch (error) {
      console.error(error);
      this.errorSignal.set('billing.loadError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async loadPlans(): Promise<void> {
    const responses = await firstValueFrom(this.plansApi.findAll());

    this.plansSignal.set(
      responses.map((response) => this.planAssembler.toEntity(response))
    );
  }

  async loadActiveSubscription(): Promise<void> {
    const userId = this.getCurrentUserId();

    const responses = await firstValueFrom(
      this.subscriptionsApi.findActiveByUserId(userId)
    );

    const activeSubscription = responses.length
      ? this.subscriptionAssembler.toEntity(responses[0])
      : null;

    this.activeSubscriptionSignal.set(activeSubscription);
  }

  async processFakePayment(payload: ProcessPaymentDto): Promise<boolean> {
    this.errorSignal.set(null);

    const sanitizedCardNumber = payload.cardNumber.replace(/\s/g, '');
    const sanitizedCvv = payload.cvv.trim();

    if (sanitizedCardNumber.length < 13 || sanitizedCardNumber.length > 19) {
      this.errorSignal.set('billing.invalidCardNumber');
      return false;
    }

    if (sanitizedCvv.length < 3 || sanitizedCvv.length > 4) {
      this.errorSignal.set('billing.invalidCvv');
      return false;
    }

    if (!payload.holderName.trim()) {
      this.errorSignal.set('billing.invalidHolderName');
      return false;
    }

    const response = await firstValueFrom(
      this.paymentsApi.create({
        userId: this.getCurrentUserId(),
        planCode: payload.planCode,
        amount: payload.amount,
        method: 'CARD',
        status: 'APPROVED',
        createdAt: new Date().toISOString().slice(0, 10),
        cardLastFourDigits: sanitizedCardNumber.slice(-4),
        holderName: payload.holderName.trim(),
      })
    );

    this.lastPaymentSignal.set(this.paymentAssembler.toEntity(response));
    return true;
  }

  async processPaymentAndSubscribe(command: PaymentFormCommand): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      if (!this.paymentValidationService.isValidHolderName(command.holderName)) {
        this.errorSignal.set('billing.invalidHolderName');
        return false;
      }

      if (!this.paymentValidationService.isValidCardNumber(command.cardNumber)) {
        this.errorSignal.set('billing.invalidCardNumber');
        return false;
      }

      if (!this.paymentValidationService.isValidExpirationDate(command.expirationDate)) {
        this.errorSignal.set('billing.invalidExpirationDate');
        return false;
      }

      if (!this.paymentValidationService.isValidCvv(command.cvv)) {
        this.errorSignal.set('billing.invalidCvv');
        return false;
      }

      const response = await firstValueFrom(
        this.subscriptionsApi.checkout({
          planCode: command.planCode,
          holderName: command.holderName.trim(),
          cardNumber: command.cardNumber,
          expirationDate: command.expirationDate,
          cvv: command.cvv,
        })
      );

      this.activeSubscriptionSignal.set(
        this.subscriptionAssembler.toEntity(response)
      );

      await this.loadLastPayment();

      return true;
    } catch (error) {
      console.error(error);
      this.errorSignal.set('billing.subscribeError');
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async subscribe(payload: SubscribeDto): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const currentSubscription = this.activeSubscriptionSignal();

      const canSubscribe = this.subscriptionPolicyService.canSubscribeToPlan(
        currentSubscription,
        payload.planCode
      );

      if (!canSubscribe) {
        this.errorSignal.set('billing.alreadySubscribed');
        return;
      }

      if (currentSubscription?.isActive) {
        await this.cancelSubscription({
          subscriptionId: currentSubscription.id,
        });
      }

      const response = await firstValueFrom(
        this.subscriptionsApi.create({
          userId: this.getCurrentUserId(),
          planCode: payload.planCode,
          status: 'ACTIVE',
          startedAt: new Date().toISOString().slice(0, 10),
          endsAt: null,
        })
      );

      this.activeSubscriptionSignal.set(
        this.subscriptionAssembler.toEntity(response)
      );
    } catch (error) {
      console.error(error);
      this.errorSignal.set('billing.subscribeError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async cancelSubscription(payload: CancelSubscriptionDto): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const response = await firstValueFrom(
        this.subscriptionsApi.cancelSubscription(payload.subscriptionId)
      );

      this.activeSubscriptionSignal.set(
        this.subscriptionAssembler.toEntity(response)
      );
    } catch (error) {
      console.error(error);
      this.errorSignal.set('billing.cancelError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async cancelCurrentSubscription(): Promise<void> {
    const currentSubscription = this.activeSubscriptionSignal();

    if (!currentSubscription) return;

    await this.cancelSubscription({
      subscriptionId: currentSubscription.id,
    });
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  async loadLastPayment(): Promise<void> {
    const userId = this.getCurrentUserId();

    const responses = await firstValueFrom(this.paymentsApi.findByUserId(userId));

    if (responses.length === 0) {
      this.lastPaymentSignal.set(null);
      return;
    }

    const sortedPayments = [...responses].sort(
      (first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    );

    this.lastPaymentSignal.set(
      this.paymentAssembler.toEntity(sortedPayments[0])
    );
  }

  private getCurrentUserId(): number {
    const userId = this.authSession.userId();

    if (!userId) {
      throw new Error('Authenticated user id was not found.');
    }

    return userId;
  }
}
