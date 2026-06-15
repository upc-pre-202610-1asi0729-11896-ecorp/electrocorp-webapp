import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';
import { EnergyGoal } from '../../domain/model/energy-goal.entity';
import { EnergyGoalAssembler } from '../assemblers/energy-goal.assembler';
import { EnergyGoalResource } from '../resources/energy-goal.resource';
import { EnergyGoalResponse } from '../responses/energy-goal.response';

@Injectable({
  providedIn: 'root',
})
export class EnergyGoalsApiService extends BaseApiService<
  EnergyGoal,
  EnergyGoalResource,
  EnergyGoalResponse
> {
  constructor(http: HttpClient) {
    super(http, 'energyGoals', new EnergyGoalAssembler());
  }

  findByUserId(userId: number): Observable<EnergyGoalResponse[]> {
    return this.http.get<EnergyGoalResponse[]>(
      `${this.apiBaseUrl}/energyGoals?userId=${userId}`
    );
  }

  updateGoal(
    goalId: number,
    resource: Partial<EnergyGoalResource>
  ): Observable<EnergyGoalResponse> {
    return this.update(goalId, resource);
  }
}
