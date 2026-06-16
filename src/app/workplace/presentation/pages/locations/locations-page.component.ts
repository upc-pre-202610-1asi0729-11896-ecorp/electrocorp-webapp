import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DeviceControlFacade } from '../../../../device-control/application/services/device-control.facade';
import { ConfirmDialogService } from '../../../../shared/application/services/confirm-dialog.service';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/presentation/components/loading-spinner/loading-spinner.component';
import { ModalFormShellComponent } from '../../../../shared/presentation/components/modal-form-shell/modal-form-shell.component';
import { SectionCardComponent } from '../../../../shared/presentation/components/section-card/section-card.component';
import { ActiveWorkplaceContextService } from '../../../application/services/active-workplace-context.service';
import { WorkplaceFacade } from '../../../application/services/workplace.facade';
import { LocationType } from '../../../domain/model/location.entity';
import { LocationCardComponent } from '../../components/location-card/location-card.component';

interface OpenStreetMapPlace {
  display_name: string;
  lat: string;
  lon: string;
}

@Component({
  selector: 'app-locations-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    AppButtonComponent,
    AppDropdownComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    LocationCardComponent,
    ModalFormShellComponent,
    SectionCardComponent,
  ],
  templateUrl: './locations-page.component.html',
  styleUrls: ['./locations-page.component.scss'],
})
export class LocationsPageComponent implements OnInit {
  name = '';
  address = '';
  type: LocationType = 'HOME';
  createModalOpen = false;
  selectedLatitude = -12.0464;
  selectedLongitude = -77.0428;
  markerX = 50;
  markerY = 50;
  addressSuggestions: OpenStreetMapPlace[] = [];
  addressSearchLoading = false;
  locatingUser = false;

  readonly types: LocationType[] = ['HOME', 'BUSINESS', 'BRANCH'];
  private mapCenterLatitude = -12.0464;
  private mapCenterLongitude = -77.0428;
  private mapZoomLevel = 12;
  private readonly mapBaseHalfSpan = 0.045;
  private readonly minMapZoomLevel = 10;
  private readonly maxMapZoomLevel = 17;
  private addressSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private addressSearchRequestId = 0;

  constructor(
    readonly workplaceFacade: WorkplaceFacade,
    readonly deviceControlFacade: DeviceControlFacade,
    private readonly activeWorkplaceContext: ActiveWorkplaceContextService,
    private readonly toastService: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly translate: TranslateService,
    private readonly sanitizer: DomSanitizer
  ) {}

  async ngOnInit(): Promise<void> {
    await this.workplaceFacade.loadWorkplace();
  }

  get typeOptions(): DropdownOption[] {
    return this.types.map((type) => ({
      label: type,
      labelKey: this.locationTypeLabelKey(type),
      value: type,
    }));
  }

  get assignedDeviceCount(): number {
    return this.workplaceFacade.deviceAssignments().length;
  }

  get unassignedDeviceCount(): number {
    return Math.max(this.deviceControlFacade.devices().length - this.assignedDeviceCount, 0);
  }

  get unroomedDeviceCount(): number {
    const devicesWithRoom = new Set(
      this.workplaceFacade
        .deviceAssignments()
        .filter((assignment) => Boolean(assignment.roomId))
        .map((assignment) => assignment.deviceId)
    );

    return Math.max(this.deviceControlFacade.devices().length - devicesWithRoom.size, 0);
  }

  get energyCoverage(): number {
    const totalDevices = this.deviceControlFacade.devices().length;

    if (totalDevices === 0) {
      return 0;
    }

    return Math.round((this.assignedDeviceCount / totalDevices) * 100);
  }

  get selectedCoordinateLabel(): string {
    return `${this.selectedLatitude.toFixed(5)}, ${this.selectedLongitude.toFixed(5)}`;
  }

  get mapPreviewUrl(): SafeResourceUrl {
    const span = this.mapHalfSpan();
    const west = this.mapCenterLongitude - span;
    const east = this.mapCenterLongitude + span;
    const south = this.mapCenterLatitude - span;
    const north = this.mapCenterLatitude + span;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${west}%2C${south}%2C${east}%2C${north}&layer=mapnik&marker=${this.selectedLatitude}%2C${this.selectedLongitude}`;

    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  openCreateModal(): void {
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
    this.clearAddressSuggestions();
  }

  async createLocation(): Promise<void> {
    const success = await this.workplaceFacade.createLocation({
      name: this.name,
      address: this.address,
      type: this.type,
    });

    if (success) {
      this.name = '';
      this.address = '';
      this.type = 'HOME';
      this.closeCreateModal();
      this.toastService.success(this.t('workplace.locationCreateSuccess'));
      return;
    }

    this.toastService.error(this.t('workplace.locationCreateError'));
  }

  async deleteLocation(locationId: number): Promise<void> {
    const locationName = this.workplaceFacade.getLocationName(locationId);
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('workplace.locations.deleteTitle'),
      message: this.t('workplace.locations.deleteMessage', { name: locationName }),
      confirmLabel: this.t('common.delete'),
      cancelLabel: this.t('common.cancel'),
      tone: 'danger',
    });

    if (!confirmed) {
      return;
    }

    const success = await this.workplaceFacade.deleteLocation(locationId);

    if (success) {
      this.toastService.info(this.t('workplace.locations.deleteSuccess'));
    }
  }

  setActiveLocation(locationId: number): void {
    this.activeWorkplaceContext.setActiveLocation(locationId);
  }

  locationTypeLabel(type: LocationType): string {
    return this.t(this.locationTypeLabelKey(type));
  }

  locationTypeLabelKey(type: LocationType): string {
    const labels: Record<LocationType, string> = {
      HOME: 'workplace.locationTypes.home',
      BUSINESS: 'workplace.locationTypes.business',
      BRANCH: 'workplace.locationTypes.branch',
    };

    return labels[type] ?? type;
  }

  selectType(value: string): void {
    this.type = value as LocationType;
  }

  onAddressChange(value: string): void {
    this.address = value;
    this.scheduleAddressSearch(value);
  }

  selectAddressSuggestion(place: OpenStreetMapPlace): void {
    const latitude = Number(place.lat);
    const longitude = Number(place.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    this.address = place.display_name;
    this.clearAddressSuggestions();
    this.setSelectedCoordinates(latitude, longitude, true);
  }

  zoomInMap(): void {
    if (this.mapZoomLevel >= this.maxMapZoomLevel) {
      return;
    }

    this.mapZoomLevel += 1;
  }

  zoomOutMap(): void {
    if (this.mapZoomLevel <= this.minMapZoomLevel) {
      return;
    }

    this.mapZoomLevel -= 1;
  }

  locateUser(): void {
    if (!navigator.geolocation) {
      this.toastService.error(this.t('workplace.locations.map.locationUnavailable'));
      return;
    }

    this.locatingUser = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.setSelectedCoordinates(latitude, longitude, true);
        void this.updateAddressFromCoordinates(latitude, longitude);
        this.locatingUser = false;
      },
      () => {
        this.locatingUser = false;
        this.toastService.error(this.t('workplace.locations.map.locationDenied'));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  selectMapPoint(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
    const span = this.mapHalfSpan();

    this.markerX = x * 100;
    this.markerY = y * 100;
    this.selectedLongitude = this.mapCenterLongitude + (x - 0.5) * span * 2;
    this.selectedLatitude = this.mapCenterLatitude + (0.5 - y) * span * 2;

    const selectedReference = this.t('workplace.locations.map.selectedAddress', {
      coordinates: this.selectedCoordinateLabel,
    });

    if (!this.address.trim() || this.isGeneratedMapReference(this.address)) {
      this.address = selectedReference;
    }

    void this.updateAddressFromCoordinates(this.selectedLatitude, this.selectedLongitude);
  }

  deviceCountForLocation(locationId: number): number {
    return this.assignmentsForLocation(locationId).length;
  }

  roomCountForLocation(locationId: number): number {
    return this.workplaceFacade.rooms().filter((room) => room.locationId === locationId).length;
  }

  groupCountForLocation(locationId: number): number {
    const deviceIds = new Set(
      this.assignmentsForLocation(locationId).map((assignment) => assignment.deviceId)
    );

    return this.deviceControlFacade
      .deviceGroups()
      .filter((group) => group.deviceIds.some((deviceId) => deviceIds.has(deviceId)))
      .length;
  }

  unroomedDeviceCountForLocation(locationId: number): number {
    return this.assignmentsForLocation(locationId).filter((assignment) => !assignment.hasRoom).length;
  }

  activeWattsForLocation(locationId: number): number {
    const deviceIds = new Set(
      this.assignmentsForLocation(locationId).map((assignment) => assignment.deviceId)
    );

    return this.deviceControlFacade
      .devices()
      .filter((device) => deviceIds.has(device.id) && device.isOn)
      .reduce((total, device) => total + device.powerWatts, 0);
  }

  coverageForLocation(locationId: number): number {
    const assignments = this.assignmentsForLocation(locationId);

    if (assignments.length === 0) {
      return 0;
    }

    const roomedDevices = assignments.filter((assignment) => assignment.hasRoom).length;
    return Math.round((roomedDevices / assignments.length) * 100);
  }

  private assignmentsForLocation(locationId: number) {
    return this.workplaceFacade
      .deviceAssignments()
      .filter((assignment) => assignment.locationId === locationId);
  }

  private mapHalfSpan(): number {
    return this.mapBaseHalfSpan / Math.pow(2, this.mapZoomLevel - 12);
  }

  private setSelectedCoordinates(latitude: number, longitude: number, centerMap: boolean): void {
    this.selectedLatitude = latitude;
    this.selectedLongitude = longitude;

    if (centerMap) {
      this.mapCenterLatitude = latitude;
      this.mapCenterLongitude = longitude;
      this.markerX = 50;
      this.markerY = 50;
    }
  }

  private scheduleAddressSearch(value: string): void {
    if (this.addressSearchTimer) {
      clearTimeout(this.addressSearchTimer);
      this.addressSearchTimer = null;
    }

    const query = value.trim();

    if (query.length < 3 || this.isGeneratedMapReference(query)) {
      this.clearAddressSuggestions();
      return;
    }

    this.addressSearchTimer = setTimeout(() => {
      this.addressSearchTimer = null;
      void this.searchAddressSuggestions(query);
    }, 350);
  }

  private async searchAddressSuggestions(query: string): Promise<void> {
    const requestId = ++this.addressSearchRequestId;
    this.addressSearchLoading = true;

    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('limit', '5');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('accept-language', this.translate.currentLang || 'es');
      url.searchParams.set('q', query);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`OpenStreetMap search failed with status ${response.status}`);
      }

      const places = (await response.json()) as OpenStreetMapPlace[];

      if (requestId === this.addressSearchRequestId) {
        this.addressSuggestions = places;
      }
    } catch {
      if (requestId === this.addressSearchRequestId) {
        this.addressSuggestions = [];
      }
    } finally {
      if (requestId === this.addressSearchRequestId) {
        this.addressSearchLoading = false;
      }
    }
  }

  private async updateAddressFromCoordinates(latitude: number, longitude: number): Promise<void> {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/reverse');
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('lat', String(latitude));
      url.searchParams.set('lon', String(longitude));
      url.searchParams.set('accept-language', this.translate.currentLang || 'es');

      const response = await fetch(url.toString());

      if (!response.ok) {
        return;
      }

      const place = (await response.json()) as Partial<OpenStreetMapPlace>;

      if (place.display_name) {
        this.address = place.display_name;
        this.clearAddressSuggestions();
      }
    } catch {
      // The selected coordinates remain valid even if the public lookup is unavailable.
    }
  }

  private clearAddressSuggestions(): void {
    this.addressSuggestions = [];
    this.addressSearchLoading = false;
  }

  private isGeneratedMapReference(value: string): boolean {
    const normalizedValue = value.trim().toLowerCase();
    return [
      'ubicacion seleccionada',
      'ubicación seleccionada',
      'selected location',
      'localizacao selecionada',
      'localização selecionada',
    ].some((prefix) => normalizedValue.startsWith(prefix));
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }
}
