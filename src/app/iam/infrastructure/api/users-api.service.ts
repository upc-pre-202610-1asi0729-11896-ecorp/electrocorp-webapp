import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';
import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { User } from '../../domain/model/user.entity';
import { UserAssembler } from '../assemblers/user.assembler';
import { UserResource } from '../resources/user.resource';
import { UserResponse } from '../responses/user.response';

@Injectable({
  providedIn: 'root',
})
export class UsersApiService extends BaseApiService<
  User,
  UserResource,
  UserResponse
> {
  constructor(
    http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    super(http, apiBaseUrl, 'users', new UserAssembler());
  }

  getCurrentProfile(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.resourceEndpoint}/me`);
  }

  updateCurrentProfile(resource: UserResource): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.resourceEndpoint}/me`, resource);
  }

  deleteCurrentAccount(): Observable<void> {
    return this.http.delete<void>(`${this.resourceEndpoint}/me`);
  }

  updateProfile(userId: number, resource: UserResource): Observable<UserResponse> {
    return this.http.put<UserResponse>(
      `${this.resourceEndpoint}/${userId}/profile`,
      resource
    );
  }

  deleteAccount(userId: number): Observable<void> {
    return this.delete(userId);
  }
}
