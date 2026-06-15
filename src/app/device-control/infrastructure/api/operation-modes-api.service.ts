import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { OperationModeResource } from '../resources/operation-mode.resource';
import { OperationModeResponse } from '../responses/operation-mode.response';

@Injectable({
  providedIn: 'root',
})
export class OperationModesApiService {
  private readonly endpoint = `${API_BASE_URL}/operation-modes`;

  constructor(private readonly http: HttpClient) {}

  findAllForCurrentUser(): Observable<OperationModeResponse[]> {
    return this.http.get<OperationModeResponse[]>(this.endpoint);
  }

  create(resource: OperationModeResource): Observable<OperationModeResponse> {
    return this.http.post<OperationModeResponse>(this.endpoint, resource);
  }
}
