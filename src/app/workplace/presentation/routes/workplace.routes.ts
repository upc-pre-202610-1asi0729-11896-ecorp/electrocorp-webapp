import { Routes } from '@angular/router';

import { activeSubscriptionGuard } from '../../../shared/application/guards/active-subscription.guard';

export const WORKPLACE_ROUTES: Routes = [
  {
    path: 'spaces/sites',
    canActivate: [activeSubscriptionGuard],
    data: { title: 'Sedes' },
    loadComponent: () =>
      import('../pages/locations/locations-page.component').then(
        (m) => m.LocationsPageComponent
      ),
  },
  {
    path: 'workplace',
    redirectTo: 'spaces/sites',
    pathMatch: 'full',
  },
  {
    path: 'workplace/locations',
    redirectTo: 'spaces/sites',
    pathMatch: 'full',
  },
];
