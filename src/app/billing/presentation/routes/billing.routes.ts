import { Routes } from '@angular/router';

import { authGuard } from '../../../shared/application/guards/auth.guard';

export const BILLING_ROUTES: Routes = [
  {
    path: 'plans',
    canActivate: [authGuard],
    data: { title: 'Planes' },
    loadComponent: () =>
      import('../pages/plans/plans-page.component').then(
        (m) => m.PlansPageComponent
      ),
  },
  {
    path: 'billing/history',
    redirectTo: 'settings/billing',
    pathMatch: 'full',
  },
];
