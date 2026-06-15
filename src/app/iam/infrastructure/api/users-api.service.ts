import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';

import { UserResource } from '../resources/user.resource';
import { UserResponse } from '../responses/user.response';

@Injectable({
  providedIn: 'root',
})
export class UsersApiService {
  private readonly usersUrl = `${API_BASE_URL}/users`;

  constructor(private readonly http: HttpClient) {}

  updateCurrentProfile(resource: UserResource): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.usersUrl}/me`, resource);
  }
}
