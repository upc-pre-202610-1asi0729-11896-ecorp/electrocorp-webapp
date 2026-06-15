import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { IamFacade } from '../../../application/services/iam.facade';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule, AppButtonComponent],
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss'],
})
export class RegisterPageComponent {
  fullName = '';
  email = '';
  password = '';

  constructor(
    readonly iamFacade: IamFacade,
    private readonly toastService: ToastService
  ) {}

  get passwordRequirements() {
    return [
      {
        label: 'Mínimo 8 caracteres',
        valid: this.password.length >= 8,
      },
      {
        label: 'Al menos una mayúscula',
        valid: /[A-ZÁÉÍÓÚÑ]/.test(this.password),
      },
      {
        label: 'Al menos un número',
        valid: /\d/.test(this.password),
      },
    ];
  }

  get passwordIsValid(): boolean {
    return this.passwordRequirements.every((requirement) => requirement.valid);
  }

  async onSubmit(): Promise<void> {
    if (!this.passwordIsValid) {
      this.toastService.warning('Completa los requisitos de contraseña.');
      return;
    }

    const success = await this.iamFacade.signUp({
      fullName: this.fullName,
      email: this.email,
      password: this.password,
    });

    if (!success) {
      this.toastService.error('No se pudo crear la cuenta.');
    }
  }
}
