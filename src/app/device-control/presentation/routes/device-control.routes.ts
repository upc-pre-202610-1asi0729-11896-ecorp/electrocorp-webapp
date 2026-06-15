import { Routes } from '@angular/router';

import { activeSubscriptionGuard } from '../../../shared/application/guards/active-subscription.guard';

export const DEVICE_CONTROL_ROUTES: Routes = [
  {
    path: 'operation/devices',
    canActivate: [activeSubscriptionGuard],
    data: { title: 'Dispositivos' },
    loadComponent: () =>
      import('../pages/devices/devices-page.component').then(
        (m) => m.DevicesPageComponent
      ),
  },
  {
    path: 'operation',
    redirectTo: 'operation/devices',
    pathMatch: 'full',
  },
  {
    path: 'devices',
    redirectTo: 'operation/devices',
    pathMatch: 'full',
  },
];
