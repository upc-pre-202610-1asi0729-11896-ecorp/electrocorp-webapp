import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';
import { Routine } from '../../domain/model/routine.entity';
import { RoutineAssembler } from '../assemblers/routine.assembler';
import { RoutineResource } from '../resources/routine.resource';
import { RoutineResponse } from '../responses/routine.response';

@Injectable({
  providedIn: 'root',
})
export class RoutinesApiService extends BaseApiService<
  Routine,
  RoutineResource,
  RoutineResponse
> {
  constructor(http: HttpClient) {
    super(http, 'routines', new RoutineAssembler());
  }

  updateEnabled(
    routineId: number,
    enabled: boolean
  ): Observable<RoutineResponse> {
    return this.updateStatus({ routineId, enabled });
  }

  updateStatus(payload: {
    routineId: number;
    enabled: boolean;
  }): Observable<RoutineResponse> {
    return this.http.patch<RoutineResponse>(
      `${this.apiBaseUrl}/routines/${payload.routineId}`,
      { enabled: payload.enabled }
    );
  }
}
