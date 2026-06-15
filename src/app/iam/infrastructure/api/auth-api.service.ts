import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/infrastructure/api/api-config';

import { SignInResource } from '../resources/sign-in.resource';
import { SignUpResource } from '../resources/sign-up.resource';
import { AuthResponse } from '../responses/auth.response';
import { UserResponse } from '../responses/user.response';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly authUrl = `${API_BASE_URL}/auth`;

  constructor(private readonly http: HttpClient) {}

  signIn(resource: SignInResource): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/sign-in`, resource);
  }

  signUp(resource: SignUpResource): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/sign-up`, resource);
  }

  signOut(): Observable<void> {
    return this.http.post<void>(`${this.authUrl}/sign-out`, {});
  }

  me(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.authUrl}/me`);
  }

  recoverPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.authUrl}/recover-password`, { email });
  }
}
