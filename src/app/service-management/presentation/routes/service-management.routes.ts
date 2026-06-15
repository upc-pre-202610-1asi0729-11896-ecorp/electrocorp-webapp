import { Routes } from '@angular/router';

import { activeSubscriptionGuard } from '../../../shared/application/guards/active-subscription.guard';

export const SERVICE_MANAGEMENT_ROUTES: Routes = [
  {
    path: 'service/support',
    canActivate: [activeSubscriptionGuard],
    data: { title: 'Soporte' },
    loadComponent: () =>
      import('../pages/support-tickets/support-tickets-page.component').then(
        (m) => m.SupportTicketsPageComponent
      ),
  },
  {
    path: 'service/maintenance',
    canActivate: [activeSubscriptionGuard],
    data: { title: 'Mantenimiento' },
    loadComponent: () =>
      import(
        '../pages/maintenance-tickets/maintenance-tickets-page.component'
        ).then((m) => m.MaintenanceTicketsPageComponent),
  },
  {
    path: 'support-tickets',
    redirectTo: 'service/support',
    pathMatch: 'full',
  },
  {
    path: 'maintenance-tickets',
    redirectTo: 'service/maintenance',
    pathMatch: 'full',
  },
];
