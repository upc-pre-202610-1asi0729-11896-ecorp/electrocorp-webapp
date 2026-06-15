import { TranslateModule } from '@ngx-translate/core';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ROUTE_PATHS } from '../../../infrastructure/constants/route-paths';

type SettingsSectionId =
  | 'profile'
  | 'account'
  | 'security'
  | 'billing'
  | 'platform';

interface SettingsNavItem {
  id: SettingsSectionId;
  labelKey: string;
  descriptionKey: string;
  link: string;
}

@Component({
  selector: 'app-settings-shell',
  standalone: true,
  imports: [
    TranslateModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './settings-shell.component.html',
  styleUrls: ['./settings-shell.component.scss'],
})
export class SettingsShellComponent {
  readonly navItems: SettingsNavItem[] = [
    {
      id: 'profile',
      labelKey: 'settings.nav.profile',
      descriptionKey: 'settings.nav.profileDescription',
      link: ROUTE_PATHS.IAM.PROFILE,
    },
    {
      id: 'account',
      labelKey: 'settings.nav.account',
      descriptionKey: 'settings.nav.accountDescription',
      link: ROUTE_PATHS.IAM.ACCOUNT,
    },
    {
      id: 'security',
      labelKey: 'settings.nav.security',
      descriptionKey: 'settings.nav.securityDescription',
      link: ROUTE_PATHS.IAM.SECURITY,
    },
    {
      id: 'billing',
      labelKey: 'settings.nav.billing',
      descriptionKey: 'settings.nav.billingDescription',
      link: ROUTE_PATHS.BILLING.SETTINGS,
    },
    {
      id: 'platform',
      labelKey: 'settings.nav.platform',
      descriptionKey: 'settings.nav.platformDescription',
      link: ROUTE_PATHS.IAM.PLATFORM,
    },
  ];

}
