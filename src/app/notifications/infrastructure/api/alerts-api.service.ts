import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';
import { Alert } from '../../domain/model/alert.entity';
import { AlertAssembler } from '../assemblers/alert.assembler';
import { AlertResource } from '../resources/alert.resource';
import { AlertResponse } from '../responses/alert.response';

@Injectable({
  providedIn: 'root',
})
export class AlertsApiService extends BaseApiService<
  Alert,
  AlertResource,
  AlertResponse
> {
  constructor(http: HttpClient) {
    super(http, 'alerts', new AlertAssembler());
  }

  createAlert(resource: AlertResource): Observable<AlertResponse> {
    return this.http.post<AlertResponse>(`${this.apiBaseUrl}/alerts`, resource);
  }

  markAsRead(alertId: number): Observable<AlertResponse> {
    return this.http.patch<AlertResponse>(
      `${this.apiBaseUrl}/alerts/${alertId}`,
      {
        read: true,
      }
    );
  }
}
