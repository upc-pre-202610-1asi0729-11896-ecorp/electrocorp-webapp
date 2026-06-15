import { Routes } from '@angular/router';

export const BILLING_ROUTES: Routes = [
  {
    path: 'billing/plans',
    data: { title: 'Plans' },
    loadComponent: () =>
      import('../pages/plans/plans-page.component').then(
        (m) => m.PlansPageComponent
      ),
  },
  {
    path: 'billing/history',
    data: { title: 'Billing History' },
    loadComponent: () =>
      import('../pages/billing-history/billing-history-page.component').then(
        (m) => m.BillingHistoryPageComponent
      ),
  },
];
