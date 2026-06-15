import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';
import { Subscription } from '../../domain/model/subscription.entity';
import { SubscriptionAssembler } from '../assemblers/subscription.assembler';
import { CheckoutSubscriptionResource } from '../resources/checkout-subscription.resource';
import { SubscriptionResource } from '../resources/subscription.resource';
import { SubscriptionResponse } from '../responses/subscription.response';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionsApiService extends BaseApiService<
  Subscription,
  SubscriptionResource,
  SubscriptionResponse
> {
  constructor(http: HttpClient) {
    super(http, 'subscriptions', new SubscriptionAssembler());
  }

  findActiveByUserId(userId: number): Observable<SubscriptionResponse[]> {
    return this.http.get<SubscriptionResponse[]>(
      `${this.apiBaseUrl}/subscriptions?userId=${userId}&status=ACTIVE`
    );
  }

  cancelSubscription(subscriptionId: number): Observable<SubscriptionResponse> {
    return this.http.patch<SubscriptionResponse>(
      `${this.apiBaseUrl}/subscriptions/${subscriptionId}`,
      {
        status: 'CANCELED',
        endsAt: new Date().toISOString().slice(0, 10),
      }
    );
  }

  checkout(resource: CheckoutSubscriptionResource): Observable<SubscriptionResponse> {
    return this.http.post<SubscriptionResponse>(
      `${this.apiBaseUrl}/subscriptions/checkout`,
      resource
    );
  }
}
