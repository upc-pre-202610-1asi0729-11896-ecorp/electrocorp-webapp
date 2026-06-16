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
    path: 'spaces/rooms',
    canActivate: [activeSubscriptionGuard],
    data: { title: 'Habitaciones' },
    loadComponent: () =>
      import('../pages/rooms/rooms-page.component').then(
        (m) => m.RoomsPageComponent
      ),
  },
  {
    path: 'spaces/assignments',
    canActivate: [activeSubscriptionGuard],
    data: { title: 'Asignaciones' },
    loadComponent: () =>
      import(
        '../pages/device-assignments/device-assignments-page.component'
        ).then((m) => m.DeviceAssignmentsPageComponent),
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
  {
    path: 'workplace/rooms',
    redirectTo: 'spaces/rooms',
    pathMatch: 'full',
  },
  {
    path: 'workplace/device-assignments',
    redirectTo: 'spaces/assignments',
    pathMatch: 'full',
  },
];
