import { Routes } from '@angular/router';

import { activeSubscriptionGuard } from '../../../shared/application/guards/active-subscription.guard';

export const REPORTING_ROUTES: Routes = [
  {
    path: 'energy/reports',
    canActivate: [activeSubscriptionGuard],
    data: { title: 'Reportes' },
    loadComponent: () =>
      import('../pages/reports/reports-page.component').then(
        (m) => m.ReportsPageComponent
      ),
  },
  {
    path: 'energy/goals',
    canActivate: [activeSubscriptionGuard],
    data: { title: 'Metas' },
    loadComponent: () =>
      import('../pages/energy-goals/energy-goals-page.component').then(
        (m) => m.EnergyGoalsPageComponent
      ),
  },
  {
    path: 'reports',
    redirectTo: 'energy/reports',
    pathMatch: 'full',
  },
  {
    path: 'reports/energy-goals',
    redirectTo: 'energy/goals',
    pathMatch: 'full',
  },
];
