import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { Plan } from '../../domain/model/plan.entity';
import { PlanAssembler } from '../assemblers/plan.assembler';
import { PlanResource } from '../resources/plan.resource';
import { PlanResponse } from '../responses/plan.response';

@Injectable({
  providedIn: 'root',
})
export class PlansApiService extends BaseApiService<
  Plan,
  PlanResource,
  PlanResponse
> {
  constructor(http: HttpClient) {
    super(http, 'billing/plans', new PlanAssembler());
  }
}
