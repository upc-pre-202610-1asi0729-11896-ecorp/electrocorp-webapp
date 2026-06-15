import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthSessionService } from '../../../shared/application/services/auth-session.service';
import { DeleteAccountCommand } from '../commands/delete-account.command';
import { RecoverPasswordCommand } from '../commands/recover-password.command';
import { SignInCommand } from '../commands/sign-in.command';
import { SignUpCommand } from '../commands/sign-up.command';
import { UpdateProfileCommand } from '../commands/update-profile.command';
import { User } from '../../domain/model/user.entity';
import { AccessProfile } from '../../domain/model/access-profile.entity';
import { AuthApiService } from '../../infrastructure/api/auth-api.service';
import { IamApiService } from '../../infrastructure/api/iam-api.service';
import { UsersApiService } from '../../infrastructure/api/users-api.service';
import { UserAssembler } from '../../infrastructure/assemblers/user.assembler';
import { AccessProfileAssembler } from '../../infrastructure/assemblers/access-profile.assembler';

@Injectable({
  providedIn: 'root',
})
export class IamFacade {
  private readonly userAssembler = new UserAssembler();
  private readonly accessProfileAssembler = new AccessProfileAssembler();

  private readonly currentUserSignal = signal<User | null>(null);
  private readonly accessProfilesSignal = signal<AccessProfile[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly currentUser = computed(() => this.currentUserSignal());
  readonly accessProfiles = computed(() => this.accessProfilesSignal());
  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor(
    private readonly authApi: AuthApiService,
    private readonly iamApi: IamApiService,
    private readonly usersApi: UsersApiService,
    private readonly authSession: AuthSessionService,
    private readonly router: Router
  ) {}

  async signIn(payload: SignInCommand): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const response = await firstValueFrom(this.authApi.signIn({
        email: payload.email,
        password: payload.password,
      }));

      const user = this.userAssembler.toEntity(response.user);

      this.currentUserSignal.set(user);
      this.accessProfilesSignal.set([]);

      this.authSession.startSession({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      });

      await this.router.navigate(['/home']);
    } catch (error) {
      console.error(error);
      this.errorSignal.set('auth.signInError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async signUp(payload: SignUpCommand): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const normalizedEmail = payload.email.trim().toLowerCase();
      const password = payload.password.trim();
      const fullName = payload.fullName.trim();

      if (!fullName) {
        this.errorSignal.set('auth.fullNameRequired');
        return;
      }

      if (!this.isValidEmail(normalizedEmail)) {
        this.errorSignal.set('auth.invalidEmail');
        return;
      }

      if (!this.isAllowedEmailProvider(normalizedEmail)) {
        this.errorSignal.set('auth.invalidEmailProvider');
        return;
      }

      if (password.length < 8) {
        this.errorSignal.set('auth.passwordTooShort');
        return;
      }

      const response = await firstValueFrom(this.authApi.signUp({
        fullName,
        email: normalizedEmail,
        password,
      }));

      const user = this.userAssembler.toEntity(response.user);

      this.currentUserSignal.set(user);
      this.accessProfilesSignal.set([]);

      this.authSession.startSession({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      });

      await this.router.navigate(['/billing/plans']);
    } catch (error) {
      console.error(error);

      if (error instanceof Error && error.message === 'Email already exists.') {
        this.errorSignal.set('auth.emailAlreadyExists');
        return;
      }

      this.errorSignal.set('auth.signUpError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isAllowedEmailProvider(email: string): boolean {
    return (
      email.endsWith('@gmail.com') ||
      email.endsWith('@outlook.com') ||
      email.endsWith('@hotmail.com')
    );
  }

  async recoverPassword(payload: RecoverPasswordCommand): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      if (!this.isValidEmail(payload.email)) {
        this.errorSignal.set('auth.invalidEmail');
        return false;
      }

      await firstValueFrom(
        this.authApi.recoverPassword(payload.email.trim().toLowerCase())
      );

      return true;
    } catch (error) {
      console.error(error);
      this.errorSignal.set('auth.recoverPasswordError');
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async updateProfile(payload: UpdateProfileCommand): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const currentUser = this.currentUserSignal();

      if (!currentUser) {
        this.errorSignal.set('auth.signInError');
        return false;
      }

      const fullName = payload.fullName.trim();
      const email = payload.email.trim().toLowerCase();

      if (!fullName) {
        this.errorSignal.set('auth.fullNameRequired');
        return false;
      }

      if (!this.isValidEmail(email)) {
        this.errorSignal.set('auth.invalidEmail');
        return false;
      }

      const response = await firstValueFrom(
        this.usersApi.updateCurrentProfile({
          fullName,
          email,
          status: currentUser.status,
        })
      );

      const updatedUser = this.userAssembler.toEntity(response);
      this.currentUserSignal.set(updatedUser);

      this.authSession.startSession({
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
      });

      return true;
    } catch (error) {
      console.error(error);
      this.errorSignal.set('auth.profileUpdateError');
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async deleteAccount(payload: DeleteAccountCommand): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      if (!this.currentUserSignal()) {
        this.errorSignal.set('auth.signInError');
        return false;
      }

      if (payload.confirmation !== 'ELIMINAR') {
        this.errorSignal.set('auth.deleteAccountConfirmationError');
        return false;
      }

      await firstValueFrom(this.usersApi.deleteCurrentAccount());

      this.currentUserSignal.set(null);
      this.accessProfilesSignal.set([]);
      this.authSession.closeSession();

      await this.router.navigate(['/iam/login']);

      return true;
    } catch (error) {
      console.error(error);
      this.errorSignal.set('auth.deleteAccountError');
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async restoreSession(): Promise<void> {
    const email = this.authSession.userEmail();

    if (!email) return;

    try {
      const response = await this.iamApi.restoreSession(email);

      if (!response) {
        this.signOut();
        return;
      }

      this.currentUserSignal.set(this.userAssembler.toEntity(response.user));

      this.accessProfilesSignal.set(
        response.accessProfiles.map((profile) =>
          this.accessProfileAssembler.toEntity(profile)
        )
      );
    } catch (error) {
      console.error(error);
      this.signOut();
    }
  }

  signOut(): void {
    this.currentUserSignal.set(null);
    this.accessProfilesSignal.set([]);
    this.authSession.closeSession();
  }
}
