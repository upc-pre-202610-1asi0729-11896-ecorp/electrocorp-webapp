import { computed, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { BillingFacade } from '../../../billing/application/services/billing.facade';
import { PlanPermissionService } from '../../../billing/domain/services/plan-permission.service';

import { Device } from '../../domain/model/device.entity';
import { DeviceGroup } from '../../domain/model/device-group.entity';
import { Routine } from '../../domain/model/routine.entity';
import { DeviceGroupPolicyService } from '../../domain/services/device-group-policy.service';
import { RoutineConflictCheckerService } from '../../domain/services/routine-conflict-checker.service';

import { CreateDeviceCommand } from '../commands/create-device.command';
import { CreateDeviceGroupCommand } from '../commands/create-device-group.command';
import { UpdateDeviceStatusCommand } from '../commands/update-device-status.command';
import { CreateRoutineDto } from '../dtos/create-routine.dto';

import { DeviceGroupsApiService } from '../../infrastructure/api/device-groups-api.service';
import { DevicesApiService } from '../../infrastructure/api/devices-api.service';
import { RoutinesApiService } from '../../infrastructure/api/routines-api.service';
import { DeviceGroupAssembler } from '../../infrastructure/assemblers/device-group.assembler';
import { DeviceAssembler } from '../../infrastructure/assemblers/device.assembler';
import { RoutineAssembler } from '../../infrastructure/assemblers/routine.assembler';

@Injectable({
  providedIn: 'root',
})
export class DeviceControlFacade {
  private readonly deviceAssembler = new DeviceAssembler();
  private readonly deviceGroupAssembler = new DeviceGroupAssembler();
  private readonly routineAssembler = new RoutineAssembler();

  private readonly devicesSignal = signal<Device[]>([]);
  private readonly deviceGroupsSignal = signal<DeviceGroup[]>([]);
  private readonly routinesSignal = signal<Routine[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly devices = computed(() => this.devicesSignal());
  readonly deviceGroups = computed(() => this.deviceGroupsSignal());
  readonly routines = computed(() => this.routinesSignal());
  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  readonly totalDevices = computed(() => this.devicesSignal().length);

  readonly activeDevices = computed(
    () => this.devicesSignal().filter((device) => device.status === 'ON').length
  );

  readonly totalCurrentWatts = computed(() =>
    this.devicesSignal()
      .filter((device) => device.status === 'ON')
      .reduce((total, device) => total + device.powerWatts, 0)
  );

  readonly totalRoutines = computed(() => this.routinesSignal().length);

  readonly enabledRoutines = computed(
    () => this.routinesSignal().filter((routine) => routine.enabled).length
  );

  constructor(
    private readonly devicesApi: DevicesApiService,
    private readonly deviceGroupsApi: DeviceGroupsApiService,
    private readonly routinesApi: RoutinesApiService,
    private readonly deviceGroupPolicy: DeviceGroupPolicyService,
    private readonly routineConflictChecker: RoutineConflictCheckerService,
    private readonly billingFacade: BillingFacade,
    private readonly planPermissionService: PlanPermissionService
  ) {}

  async loadDevices(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const responses = await firstValueFrom(this.devicesApi.findAll());
      this.devicesSignal.set(
        responses.map((response) => this.deviceAssembler.toEntity(response))
      );
    } catch (error) {
      console.error(error);
      this.errorSignal.set('devices.loadError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async loadRoutines(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const responses = await firstValueFrom(this.routinesApi.findAll());
      this.routinesSignal.set(
        responses.map((response) => this.routineAssembler.toEntity(response))
      );
    } catch (error) {
      console.error(error);
      this.errorSignal.set('routines.loadError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async addDevice(payload: CreateDeviceCommand): Promise<void> {
    await this.createDevice(payload);
  }

  async createDevice(command: CreateDeviceCommand): Promise<Device | null> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await this.billingFacade.loadBilling();

      const activePlanCode = this.billingFacade.activePlanCode();

      const canCreateDevice = this.planPermissionService.canCreateDevice(
        activePlanCode,
        this.devicesSignal().length
      );

      if (!canCreateDevice) {
        this.errorSignal.set('devices.planLimitReached');
        return null;
      }

      if (!command.name.trim()) {
        this.errorSignal.set('devices.createError');
        return null;
      }

      const response = await firstValueFrom(
        this.devicesApi.create({
          name: command.name.trim(),
          room: command.room?.trim() ?? '',
          type: command.type,
          powerWatts: Number(command.powerWatts),
        })
      );

      const createdDevice = this.deviceAssembler.toEntity({
        ...response,
        status: response.status ?? 'OFF',
      });

      this.devicesSignal.set([...this.devicesSignal(), createdDevice]);
      return createdDevice;
    } catch (error) {
      console.error(error);
      this.errorSignal.set('devices.createError');
      return null;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async toggleDevice(deviceId: number): Promise<void> {
    const currentDevice = this.devicesSignal().find(
      (device) => device.id === deviceId
    );

    if (!currentDevice) return;

    const nextStatus = currentDevice.status === 'ON' ? 'OFF' : 'ON';

    await this.updateDeviceStatus({
      deviceId,
      status: nextStatus,
    });
  }

  async updateDeviceStatus(
    command: UpdateDeviceStatusCommand
  ): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.devicesApi.updateStatus({
          deviceId: command.deviceId,
          status: command.status,
        })
      );

      const updatedDevice = this.deviceAssembler.toEntity(response);

      this.devicesSignal.set(
        this.devicesSignal().map((device) =>
          device.id === command.deviceId ? updatedDevice : device
        )
      );

      return true;
    } catch (error) {
      console.error(error);
      this.errorSignal.set('devices.updateError');
      return false;
    }
  }

  async removeDevice(deviceId: number): Promise<void> {
    try {
      await firstValueFrom(this.devicesApi.delete(deviceId));

      this.devicesSignal.set(
        this.devicesSignal().filter((device) => device.id !== deviceId)
      );

      this.routinesSignal.set(
        this.routinesSignal().filter((routine) => routine.deviceId !== deviceId)
      );
    } catch (error) {
      console.error(error);
      this.errorSignal.set('devices.deleteError');
    }
  }

  async loadDeviceGroups(): Promise<void> {
    try {
      const responses = await firstValueFrom(
        this.deviceGroupsApi.findAllForCurrentUser()
      );

      this.deviceGroupsSignal.set(
        responses.map((response) => this.deviceGroupAssembler.toEntity(response))
      );
    } catch (error) {
      console.error(error);
      this.errorSignal.set('deviceGroups.loadError');
    }
  }

  async createDeviceGroup(
    command: CreateDeviceGroupCommand
  ): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      if (!this.deviceGroupPolicy.canCreateGroup(command.name, command.deviceIds)) {
        this.errorSignal.set('deviceGroups.createError');
        return false;
      }

      const response = await firstValueFrom(
        this.deviceGroupsApi.create({
          name: command.name.trim(),
          description: command.description?.trim() ?? '',
          deviceIds: command.deviceIds,
          createdAt: new Date().toISOString().slice(0, 10),
        })
      );

      const group = this.deviceGroupAssembler.toEntity(response);

      this.deviceGroupsSignal.set([group, ...this.deviceGroupsSignal()]);
      return true;
    } catch (error) {
      console.error(error);
      this.errorSignal.set('deviceGroups.createError');
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async addRoutine(payload: CreateRoutineDto): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await this.billingFacade.loadBilling();

      const activePlanCode = this.billingFacade.activePlanCode();

      const canCreateRoutine = this.planPermissionService.canCreateRoutine(
        activePlanCode,
        this.routinesSignal().length
      );

      if (!canCreateRoutine) {
        this.errorSignal.set('routines.planLimitReached');
        return;
      }

      const candidateRoutine = new Routine({
        id: Date.now(),
        name: payload.name,
        deviceId: payload.deviceId,
        action: payload.action,
        scheduledTime: payload.scheduledTime,
        enabled: true,
      });

      const hasConflict = this.routineConflictChecker.hasConflict(
        candidateRoutine,
        this.routinesSignal()
      );

      if (hasConflict) {
        this.errorSignal.set('routines.conflictError');
        return;
      }

      const response = await firstValueFrom(
        this.routinesApi.create({
          name: payload.name,
          deviceId: payload.deviceId,
          action: payload.action,
          scheduledTime: payload.scheduledTime,
          enabled: true,
        })
      );

      const createdRoutine = this.routineAssembler.toEntity(response);
      this.routinesSignal.set([createdRoutine, ...this.routinesSignal()]);
    } catch (error) {
      console.error(error);
      this.errorSignal.set('routines.createError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async toggleRoutine(routineId: number): Promise<void> {
    const currentRoutine = this.routinesSignal().find(
      (routine) => routine.id === routineId
    );

    if (!currentRoutine) return;

    try {
      const response = await firstValueFrom(
        this.routinesApi.updateEnabled(routineId, !currentRoutine.enabled)
      );

      const updatedRoutine = this.routineAssembler.toEntity(response);

      this.routinesSignal.set(
        this.routinesSignal().map((routine) =>
          routine.id === routineId ? updatedRoutine : routine
        )
      );
    } catch (error) {
      console.error(error);
      this.errorSignal.set('routines.updateError');
    }
  }

  async removeRoutine(routineId: number): Promise<void> {
    try {
      await firstValueFrom(this.routinesApi.delete(routineId));

      this.routinesSignal.set(
        this.routinesSignal().filter((routine) => routine.id !== routineId)
      );
    } catch (error) {
      console.error(error);
      this.errorSignal.set('routines.deleteError');
    }
  }

  getDeviceName(deviceId: number): string {
    return (
      this.devicesSignal().find((device) => device.id === deviceId)?.name ??
      'Unknown device'
    );
  }
}
