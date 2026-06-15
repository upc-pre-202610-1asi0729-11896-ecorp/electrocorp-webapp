import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { IamFacade } from '../../../application/services/iam.facade';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';

@Component({
  selector: 'app-recover-password-page',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule, AppButtonComponent],
  templateUrl: './recover-password-page.component.html',
  styleUrls: ['./recover-password-page.component.scss'],
})
export class RecoverPasswordPageComponent {
  email = '';

  constructor(
    readonly iamFacade: IamFacade,
    private readonly toastService: ToastService
  ) {}

  async onSubmit(): Promise<void> {
    const success = await this.iamFacade.recoverPassword({
      email: this.email,
    });

    if (success) {
      this.toastService.success('Solicitud de recuperación enviada.');
    } else {
      this.toastService.error('No se pudo enviar la recuperación.');
    }
  }
}
