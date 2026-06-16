import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';

import { AppDropdownComponent } from '../app-dropdown/app-dropdown.component';
import { DropdownOption } from '../app-dropdown/dropdown-option.model';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    LanguageSwitcherComponent,
    AppDropdownComponent,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() showPrivateNavigation = false;
  @Input() isDarkMode = true;
  @Input() userInitial = '';

  @Output() themeToggled = new EventEmitter<void>();
  @Output() userMenuToggled = new EventEmitter<void>();

  readonly currentUrl = signal('');

  readonly energyOptions: DropdownOption[] = [
    { label: 'Consumo', labelKey: 'nav.consumption', value: 'energy', route: '/energy/consumption', description: 'Consumo actual' },
    { label: 'Historial', labelKey: 'nav.history', value: 'energy-history', route: '/energy/history', description: 'Lecturas anteriores' },
    { label: 'Reportes', labelKey: 'nav.reports', value: 'reports', route: '/energy/reports', aliases: ['/reports'], description: 'Analisis energetico' },
    { label: 'Metas', labelKey: 'nav.energyGoals', value: 'energy-goals', route: '/energy/goals', aliases: ['/reports/energy-goals'], description: 'Objetivos de consumo' },
  ];

  readonly workplaceOptions: DropdownOption[] = [
    { label: 'Sedes', labelKey: 'nav.locations', value: 'locations', route: '/spaces/sites', aliases: ['/workplace/locations'], description: 'Centros operativos' },
    { label: 'Habitaciones', labelKey: 'nav.rooms', value: 'rooms', route: '/spaces/rooms', aliases: ['/workplace/rooms'], description: 'Espacios internos' },
    { label: 'Asignaciones', labelKey: 'nav.assignments', value: 'assignments', route: '/spaces/assignments', aliases: ['/workplace/device-assignments'], description: 'Dispositivos por habitacion' },
  ];

  readonly operationOptions: DropdownOption[] = [
    { label: 'Dispositivos', labelKey: 'nav.devices', value: 'devices', route: '/operation/devices', aliases: ['/devices'], description: 'Control de equipos' },
    { label: 'Grupos', labelKey: 'nav.deviceGroups', value: 'device-groups', route: '/operation/groups', aliases: ['/device-groups'], description: 'Agrupacion de dispositivos' },
    { label: 'Rutinas', labelKey: 'nav.routines', value: 'routines', route: '/operation/routines', aliases: ['/routines'], description: 'Automatizacion' },
    { label: 'Modos', labelKey: 'nav.operationModes', value: 'operation-modes', route: '/operation/modes', aliases: ['/operation-modes'], description: 'Planes operativos' },
  ];

  readonly alertsOptions: DropdownOption[] = [
    { label: 'Bandeja', labelKey: 'nav.inbox', value: 'alerts', route: '/alerts/inbox', aliases: ['/alerts'], description: 'Eventos detectados' },
    { label: 'Reglas', labelKey: 'nav.rules', value: 'alert-rules', route: '/alerts/rules', description: 'Umbrales automaticos' },
    { label: 'Preferencias', labelKey: 'nav.preferences', value: 'alert-preferences', route: '/alerts/preferences', aliases: ['/notifications/preferences', '/settings/notifications'], description: 'Sensibilidad y ruido' },
  ];

  readonly supportOptions: DropdownOption[] = [
    { label: 'Soporte', labelKey: 'nav.supportTickets', value: 'support-tickets', route: '/service/support', aliases: ['/support-tickets'], description: 'Atencion al usuario' },
    { label: 'Mantenimiento', labelKey: 'nav.maintenanceTickets', value: 'maintenance-tickets', route: '/service/maintenance', aliases: ['/maintenance-tickets'], description: 'Revision tecnica' },
  ];

  constructor(private readonly router: Router) {
    this.currentUrl.set(this.router.url.split('?')[0]);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects.split('?')[0]));
  }

  activeValue(options: DropdownOption[]): string | null {
    const url = this.currentUrl();
    const match = options
      .map((option) => ({
        option,
        matchedLength: this.matchedRouteLength(url, option),
      }))
      .filter((match) => match.matchedLength >= 0)
      .sort((left, right) => right.matchedLength - left.matchedLength)[0];

    return match?.option.value ?? null;
  }

  toggleTheme(): void {
    this.themeToggled.emit();
  }

  toggleUserMenu(): void {
    this.userMenuToggled.emit();
  }

  private matchedRouteLength(url: string, option: DropdownOption): number {
    const routes = [option.route, ...(option.aliases ?? [])].filter(
      (route): route is string => Boolean(route)
    );

    return routes.reduce((bestMatch, route) => {
      const matches = url === route || url.startsWith(`${route}/`);

      return matches ? Math.max(bestMatch, route.length) : bestMatch;
    }, -1);
  }
}
