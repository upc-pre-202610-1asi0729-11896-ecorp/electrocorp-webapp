import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { DeviceGroupResource } from '../resources/device-group.resource';
import { DeviceGroupResponse } from '../responses/device-group.response';

@Injectable({
  providedIn: 'root',
})
export class DeviceGroupsApiService {
  private readonly resourcePath = `${API_BASE_URL}/device-groups`;

  constructor(private readonly http: HttpClient) {}

  findAllForCurrentUser(): Observable<DeviceGroupResponse[]> {
    return this.http.get<DeviceGroupResponse[]>(this.resourcePath);
  }

  create(resource: DeviceGroupResource): Observable<DeviceGroupResponse> {
    return this.http.post<DeviceGroupResponse>(this.resourcePath, resource);
  }

  patch(
    groupId: number,
    resource: Partial<DeviceGroupResource>
  ): Observable<DeviceGroupResponse> {
    return this.http.patch<DeviceGroupResponse>(
      `${this.resourcePath}/${groupId}`,
      resource
    );
  }
}
