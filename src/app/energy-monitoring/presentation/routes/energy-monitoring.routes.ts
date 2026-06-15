import { Routes } from '@angular/router';

import { activeSubscriptionGuard } from '../../../shared/application/guards/active-subscription.guard';

export const ENERGY_MONITORING_ROUTES: Routes = [
  {
    path: 'energy/consumption',
    canActivate: [activeSubscriptionGuard],
    data: { title: 'Consumo' },
    loadComponent: () =>
      import('../pages/energy-dashboard/energy-dashboard-page.component').then(
        (m) => m.EnergyDashboardPageComponent
      ),
  },
  {
    path: 'energy',
    redirectTo: 'energy/consumption',
    pathMatch: 'full',
  },
  {
    path: 'energy/history',
    canActivate: [activeSubscriptionGuard],
    data: { title: 'Historial' },
    loadComponent: () =>
      import('../pages/energy-history/energy-history-page.component').then(
        (m) => m.EnergyHistoryPageComponent
      ),
  },
];
