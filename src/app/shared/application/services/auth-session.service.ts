import { computed, Injectable, signal } from '@angular/core';

export interface AuthenticatedUserSession {
  id: number;
  fullName: string;
  email: string;
  token: string;
  accessProfileId?: number;
  accessProfileName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly storageKey = 'electrocorp_auth_session';
  private readonly currentUserSignal = signal<AuthenticatedUserSession | null>(null);
  private readonly loadingSignal = signal<boolean>(false);

  readonly currentUser = computed(() => this.currentUserSignal());
  readonly loading = computed(() => this.loadingSignal());

  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  readonly userId = computed(() => this.currentUserSignal()?.id ?? null);
  readonly token = computed(() => this.currentUserSignal()?.token ?? null);
  readonly userEmail = computed(() => this.currentUserSignal()?.email ?? null);
  readonly userFullName = computed(() => this.currentUserSignal()?.fullName ?? null);
  readonly accessProfileName = computed(
    () => this.currentUserSignal()?.accessProfileName ?? null
  );

  setLoading(value: boolean): void {
    this.loadingSignal.set(value);
  }

  setCurrentUser(user: AuthenticatedUserSession): void {
    this.currentUserSignal.set(user);
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  clearSession(): void {
    this.currentUserSignal.set(null);
    localStorage.removeItem(this.storageKey);
  }

  restoreStoredSession(): AuthenticatedUserSession | null {
    const rawSession = localStorage.getItem(this.storageKey);

    if (!rawSession) {
      return null;
    }

    try {
      const session = JSON.parse(rawSession) as AuthenticatedUserSession;

      if (!session.id || !session.email || !session.fullName || !session.token) {
        this.clearSession();
        return null;
      }

      this.currentUserSignal.set(session);
      return session;
    } catch {
      this.clearSession();
      return null;
    }
  }
}
