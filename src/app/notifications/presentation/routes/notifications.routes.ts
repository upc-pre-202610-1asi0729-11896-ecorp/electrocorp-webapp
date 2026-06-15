import { Routes } from '@angular/router';

import { activeSubscriptionGuard } from '../../../shared/application/guards/active-subscription.guard';

export const NOTIFICATIONS_ROUTES: Routes = [
  {
    path: 'alerts/inbox',
    canActivate: [activeSubscriptionGuard],
    data: { title: 'Alertas' },
    loadComponent: () =>
      import('../pages/alerts/alerts-page.component').then(
        (m) => m.AlertsPageComponent
      ),
  },
  {
    path: 'alerts',
    redirectTo: 'alerts/inbox',
    pathMatch: 'full',
  },
  {
    path: 'alerts/rules',
    canActivate: [activeSubscriptionGuard],
    data: { title: 'Reglas' },
    loadComponent: () =>
      import('../pages/alert-rules/alert-rules-page.component').then(
        (m) => m.AlertRulesPageComponent
      ),
  },
  {
    path: 'alerts/preferences',
    canActivate: [activeSubscriptionGuard],
    data: { title: 'Preferencias' },
    loadComponent: () =>
      import('../pages/notification-preferences/notification-preferences-page.component').then(
        (m) => m.NotificationPreferencesPageComponent
      ),
  },
  {
    path: 'notifications/preferences',
    redirectTo: '/alerts/preferences',
    pathMatch: 'full',
  },
];
