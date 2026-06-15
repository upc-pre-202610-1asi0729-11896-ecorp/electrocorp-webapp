import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { NotificationPreferenceResource } from '../resources/notification-preference.resource';
import { NotificationPreferenceResponse } from '../responses/notification-preference.response';

@Injectable({
  providedIn: 'root',
})
export class NotificationPreferencesApiService {
  private readonly resourcePath = `${API_BASE_URL}/notifications/preferences`;

  constructor(private readonly http: HttpClient) {}

  findCurrent(): Observable<NotificationPreferenceResponse> {
    return this.http.get<NotificationPreferenceResponse>(this.resourcePath);
  }

  save(resource: NotificationPreferenceResource): Observable<NotificationPreferenceResponse> {
    return this.http.put<NotificationPreferenceResponse>(this.resourcePath, resource);
  }
}
