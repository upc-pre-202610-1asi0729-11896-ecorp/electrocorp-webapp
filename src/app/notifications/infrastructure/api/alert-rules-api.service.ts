import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { AlertRuleResource } from '../resources/alert-rule.resource';
import { AlertRuleResponse } from '../responses/alert-rule.response';

@Injectable({
  providedIn: 'root',
})
export class AlertRulesApiService {
  private readonly resourcePath = `${API_BASE_URL}/alerts/rules`;

  constructor(private readonly http: HttpClient) {}

  findAllForCurrentUser(): Observable<AlertRuleResponse[]> {
    return this.http.get<AlertRuleResponse[]>(this.resourcePath);
  }

  create(resource: AlertRuleResource): Observable<AlertRuleResponse> {
    return this.http.post<AlertRuleResponse>(this.resourcePath, resource);
  }
}
