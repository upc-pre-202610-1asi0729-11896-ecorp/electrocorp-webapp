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
    path: 'operation/groups',
    canActivate: [activeSubscriptionGuard],
    data: { title: 'Grupos' },
    loadComponent: () =>
      import('../pages/device-groups/device-groups-page.component').then(
        (m) => m.DeviceGroupsPageComponent
      ),
  },
  {
    path: 'operation/routines',
    canActivate: [activeSubscriptionGuard],
    data: { title: 'Rutinas' },
    loadComponent: () =>
      import('../pages/routines/routines-page.component').then(
        (m) => m.RoutinesPageComponent
      ),
  },
  {
    path: 'operation/modes',
    canActivate: [activeSubscriptionGuard],
    data: { title: 'Modos' },
    loadComponent: () =>
      import('../pages/operation-modes/operation-modes-page.component').then(
        (m) => m.OperationModesPageComponent
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
  {
    path: 'routines',
    redirectTo: 'operation/routines',
    pathMatch: 'full',
  },
  {
    path: 'operation-modes',
    redirectTo: 'operation/modes',
    pathMatch: 'full',
  },
  {
    path: 'device-groups',
    redirectTo: 'operation/groups',
    pathMatch: 'full',
  },
];
