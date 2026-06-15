import { computed, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthSessionService } from '../../../shared/application/services/auth-session.service';

import { CreateLocationCommand } from '../commands/create-location.command';
import { UpdateLocationCommand } from '../commands/update-location.command';
import { CreateRoomCommand } from '../commands/create-room.command';
import { UpdateRoomCommand } from '../commands/update-room.command';
import { AssignDeviceCommand } from '../commands/assign-device.command';
import { MoveDeviceAssignmentCommand } from '../commands/move-device-assignment.command';

import { Location } from '../../domain/model/location.entity';
import { Room } from '../../domain/model/room.entity';
import { DeviceAssignment } from '../../domain/model/device-assignment.entity';

import { LocationsApiService } from '../../infrastructure/api/locations-api.service';
import { RoomsApiService } from '../../infrastructure/api/rooms-api.service';
import { DeviceAssignmentsApiService } from '../../infrastructure/api/device-assignments-api.service';

import { LocationAssembler } from '../../infrastructure/assemblers/location.assembler';
import { RoomAssembler } from '../../infrastructure/assemblers/room.assembler';
import { DeviceAssignmentAssembler } from '../../infrastructure/assemblers/device-assignment.assembler';

@Injectable({
  providedIn: 'root',
})
export class WorkplaceFacade {
  private readonly locationAssembler = new LocationAssembler();
  private readonly roomAssembler = new RoomAssembler();
  private readonly deviceAssignmentAssembler = new DeviceAssignmentAssembler();

  private readonly locationsSignal = signal<Location[]>([]);
  private readonly roomsSignal = signal<Room[]>([]);
  private readonly assignmentsSignal = signal<DeviceAssignment[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly locations = computed(() => this.locationsSignal());
  readonly rooms = computed(() => this.roomsSignal());
  readonly assignments = computed(() => this.assignmentsSignal());
  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  readonly totalLocations = computed(() => this.locationsSignal().length);
  readonly totalRooms = computed(() => this.roomsSignal().length);
  readonly totalAssignments = computed(() => this.assignmentsSignal().length);

  readonly averageRoomsPerLocation = computed(() => {
    const locations = this.totalLocations();
    if (!locations) return 0;
    return Number((this.totalRooms() / locations).toFixed(1));
  });

  readonly locationCards = computed(() =>
    [...this.locationsSignal()]
      .map((location) => {
        const rooms = this.roomsSignal().filter((room) => room.locationId === location.id);
        const assignments = this.assignmentsSignal().filter(
          (assignment) => assignment.locationId === location.id
        );

        const floors = [...new Set(rooms.map((room) => room.floor))].sort((a, b) => a - b);

        return {
          location,
          rooms,
          assignments,
          roomCount: rooms.length,
          assignmentCount: assignments.length,
          floors,
        };
      })
      .sort(
        (a, b) =>
          b.assignmentCount - a.assignmentCount || b.roomCount - a.roomCount
      )
  );

  readonly emptyLocations = computed(
    () => this.locationCards().filter((card) => card.assignmentCount === 0).length
  );

  readonly assignmentCoverage = computed(() => {
    const total = this.totalLocations();
    if (!total) return 0;

    const covered = this.locationCards().filter((card) => card.assignmentCount > 0).length;
    return Math.round((covered / total) * 100);
  });

  readonly busiestLocation = computed(() => {
    const cards = this.locationCards();
    return cards.length ? cards[0] : null;
  });

  readonly typeBreakdown = computed(() => {
    const counter = new Map<string, number>();

    this.locationsSignal().forEach((location) => {
      counter.set(location.type, (counter.get(location.type) ?? 0) + 1);
    });

    return Array.from(counter.entries()).map(([label, count]) => ({
      label,
      count,
    }));
  });

  constructor(
    private readonly locationsApi: LocationsApiService,
    private readonly roomsApi: RoomsApiService,
    private readonly deviceAssignmentsApi: DeviceAssignmentsApiService,
    private readonly authSession: AuthSessionService
  ) {}

  async loadWorkplace(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await Promise.all([
        this.loadLocations(),
        this.loadRooms(),
        this.loadAssignments(),
      ]);
    } catch (error) {
      console.error(error);
      this.errorSignal.set('workplace.loadError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async createLocation(payload: CreateLocationCommand): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await firstValueFrom(
        this.locationsApi.create({
          name: payload.name,
          address: payload.address,
          city: '',
          country: '',
          type: payload.type,
        })
      );

      await this.loadLocations();
    } catch (error) {
      console.error(error);
      this.errorSignal.set('workplace.createLocationError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async updateLocation(payload: UpdateLocationCommand): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await firstValueFrom(
        this.locationsApi.update(payload.locationId, {
          name: payload.name,
          address: payload.address,
          type: payload.type,
        })
      );

      await this.loadLocations();
    } catch (error) {
      console.error(error);
      this.errorSignal.set('workplace.updateLocationError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async createRoom(payload: CreateRoomCommand): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await firstValueFrom(
        this.roomsApi.create({
          locationId: payload.locationId,
          name: payload.name,
          floor: Number(payload.floor),
        })
      );

      await this.loadRooms();
    } catch (error) {
      console.error(error);
      this.errorSignal.set('workplace.createRoomError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async updateRoom(payload: UpdateRoomCommand): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await firstValueFrom(
        this.roomsApi.update(payload.roomId, {
          locationId: payload.locationId,
          name: payload.name,
          floor: Number(payload.floor),
        })
      );

      await this.loadRooms();
    } catch (error) {
      console.error(error);
      this.errorSignal.set('workplace.updateRoomError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async assignDevice(payload: AssignDeviceCommand): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await firstValueFrom(
        this.deviceAssignmentsApi.create({
          deviceId: payload.deviceId,
          userId: this.getCurrentUserId(),
          locationId: payload.locationId,
          roomId: payload.roomId ?? null,
          assignedAt: new Date().toISOString().slice(0, 10),
        })
      );

      await this.loadAssignments();
    } catch (error) {
      console.error(error);
      this.errorSignal.set('workplace.assignDeviceError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async moveDeviceAssignment(payload: MoveDeviceAssignmentCommand): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await firstValueFrom(
        this.deviceAssignmentsApi.update(payload.assignmentId, {
          locationId: payload.locationId,
          roomId: payload.roomId ?? null,
        })
      );

      await this.loadAssignments();
    } catch (error) {
      console.error(error);
      this.errorSignal.set('workplace.moveDeviceAssignmentError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  private async loadLocations(): Promise<void> {
    const responses = await firstValueFrom(this.locationsApi.findAll());

    this.locationsSignal.set(
      responses.map((response) => this.locationAssembler.toEntity(response))
    );
  }

  private async loadRooms(): Promise<void> {
    const responses = await firstValueFrom(this.roomsApi.findAll());

    this.roomsSignal.set(
      responses.map((response) => this.roomAssembler.toEntity(response))
    );
  }

  private async loadAssignments(): Promise<void> {
    const userId = this.getCurrentUserId();

    const responses = await firstValueFrom(
      this.deviceAssignmentsApi.findByUserId(userId)
    );

    this.assignmentsSignal.set(
      responses.map((response) =>
        this.deviceAssignmentAssembler.toEntity(response)
      )
    );
  }

  getRoomsByLocationId(locationId: number): Room[] {
    return this.roomsSignal().filter((room) => room.locationId === locationId);
  }

  getAssignmentsByLocationId(locationId: number): DeviceAssignment[] {
    return this.assignmentsSignal().filter(
      (assignment) => assignment.locationId === locationId
    );
  }

  private getCurrentUserId(): number {
    const userId = this.authSession.userId();

    if (!userId) {
      throw new Error('Authenticated user id was not found.');
    }

    return userId;
  }
}
