import { computed, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { BillingFacade } from '../../../billing/application/services/billing.facade';
import { PlanPermissionService } from '../../../billing/domain/services/plan-permission.service';

import { Device } from '../../domain/model/device.entity';
import { DeviceGroup } from '../../domain/model/device-group.entity';
import { OperationMode } from '../../domain/model/operation-mode.entity';
import { Routine } from '../../domain/model/routine.entity';
import { DeviceGroupPolicyService } from '../../domain/services/device-group-policy.service';
import { RoutineConflictCheckerService } from '../../domain/services/routine-conflict-checker.service';

import { CreateDeviceCommand } from '../commands/create-device.command';
import { CreateDeviceGroupCommand } from '../commands/create-device-group.command';
import { CreateOperationModeCommand } from '../commands/create-operation-mode.command';
import { CreateRoutineCommand } from '../commands/create-routine.command';
import { ExecuteGroupActionCommand } from '../commands/execute-group-action.command';
import { UpdateDeviceGroupCommand } from '../commands/update-device-group.command';
import { UpdateDeviceStatusCommand } from '../commands/update-device-status.command';
import { UpdateRoutineStatusCommand } from '../commands/update-routine-status.command';
import { CreateRoutineDto } from '../dtos/create-routine.dto';

import { DeviceGroupsApiService } from '../../infrastructure/api/device-groups-api.service';
import { DevicesApiService } from '../../infrastructure/api/devices-api.service';
import { OperationModesApiService } from '../../infrastructure/api/operation-modes-api.service';
import { RoutinesApiService } from '../../infrastructure/api/routines-api.service';
import { DeviceGroupAssembler } from '../../infrastructure/assemblers/device-group.assembler';
import { DeviceAssembler } from '../../infrastructure/assemblers/device.assembler';
import { OperationModeAssembler } from '../../infrastructure/assemblers/operation-mode.assembler';
import { RoutineAssembler } from '../../infrastructure/assemblers/routine.assembler';

@Injectable({
  providedIn: 'root',
})
export class DeviceControlFacade {
  private readonly deviceAssembler = new DeviceAssembler();
  private readonly deviceGroupAssembler = new DeviceGroupAssembler();
  private readonly operationModeAssembler = new OperationModeAssembler();
  private readonly routineAssembler = new RoutineAssembler();

  private readonly devicesSignal = signal<Device[]>([]);
  private readonly deviceGroupsSignal = signal<DeviceGroup[]>([]);
  private readonly operationModesSignal = signal<OperationMode[]>([]);
  private readonly routinesSignal = signal<Routine[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly devices = computed(() => this.devicesSignal());
  readonly deviceGroups = computed(() => this.deviceGroupsSignal());
  readonly operationModes = computed(() => this.operationModesSignal());
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
    private readonly operationModesApi: OperationModesApiService,
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

  async updateDeviceGroup(
    command: UpdateDeviceGroupCommand
  ): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const response = await firstValueFrom(
        this.deviceGroupsApi.patch(command.groupId, {
          name: command.name.trim(),
          description: command.description?.trim() ?? '',
          deviceIds: command.deviceIds,
        })
      );

      const group = this.deviceGroupAssembler.toEntity(response);

      this.deviceGroupsSignal.set(
        this.deviceGroupsSignal().map((item) =>
          item.id === group.id ? group : item
        )
      );

      return true;
    } catch (error) {
      console.error(error);
      this.errorSignal.set('deviceGroups.updateError');
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async executeGroupAction(
    command: ExecuteGroupActionCommand
  ): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const group = this.deviceGroupsSignal().find(
        (item) => item.id === command.groupId
      );

      if (!this.deviceGroupPolicy.canExecuteGroupAction(group)) {
        this.errorSignal.set('deviceGroups.executeError');
        return false;
      }

      await firstValueFrom(
        this.deviceGroupsApi.executeAction({
          groupId: command.groupId,
          status: command.status,
        })
      );

      await this.loadDevices();
      return true;
    } catch (error) {
      console.error(error);
      this.errorSignal.set('deviceGroups.executeError');
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async loadOperationModes(): Promise<void> {
    try {
      const responses = await firstValueFrom(
        this.operationModesApi.findAllForCurrentUser()
      );

      this.operationModesSignal.set(
        responses.map((response) => this.operationModeAssembler.toEntity(response))
      );
    } catch (error) {
      console.error(error);
      this.errorSignal.set('operationModes.loadError');
    }
  }

  async createOperationMode(
    command: CreateOperationModeCommand
  ): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const response = await firstValueFrom(
        this.operationModesApi.create({
          ...command,
          routineIds: command.routineIds ?? [],
          routinesToEnableIds: command.routinesToEnableIds ?? [],
          routinesToDisableIds: command.routinesToDisableIds ?? [],
          applyRoutines: command.applyRoutines ?? false,
        })
      );

      const mode = this.operationModeAssembler.toEntity(response);
      this.operationModesSignal.set([mode, ...this.operationModesSignal()]);

      return true;
    } catch (error) {
      console.error(error);
      this.errorSignal.set('operationModes.createError');
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async addRoutine(payload: CreateRoutineDto): Promise<void> {
    await this.createRoutine({
      name: payload.name,
      deviceId: payload.deviceId,
      targetType: 'DEVICE',
      targetId: payload.deviceId,
      action: payload.action,
      time: payload.scheduledTime,
    });
  }

  async createRoutine(command: CreateRoutineCommand): Promise<boolean> {
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
        return false;
      }

      const hasConflict = this.routineConflictChecker.hasConflict(
        this.routinesSignal(),
        {
          action: command.action,
          time: command.time,
          targetType: command.targetType,
          targetId: command.targetId,
        }
      );

      if (hasConflict) {
        this.errorSignal.set('routines.conflictError');
        return false;
      }

      const response = await firstValueFrom(
        this.routinesApi.create({
          name: command.name.trim(),
          deviceId: command.deviceId ?? null,
          groupId: command.groupId ?? null,
          targetType: command.targetType,
          targetId: command.targetId,
          action: command.action,
          time: command.time,
          scheduledTime: command.time,
          repeatType: command.repeatType ?? 'DAILY',
          daysOfWeek: command.daysOfWeek ?? '',
          intervalDays: command.intervalDays ?? 1,
          startsOn: command.startsOn ?? null,
          enabled: true,
        })
      );

      const createdRoutine = this.routineAssembler.toEntity(response);
      this.routinesSignal.set([createdRoutine, ...this.routinesSignal()]);
      return true;
    } catch (error) {
      console.error(error);
      this.errorSignal.set('routines.createError');
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async toggleRoutine(routineId: number): Promise<void> {
    const currentRoutine = this.routinesSignal().find(
      (routine) => routine.id === routineId
    );

    if (!currentRoutine) return;

    await this.updateRoutineStatus({
      routineId,
      enabled: !currentRoutine.enabled,
    });
  }

  async updateRoutineStatus(
    command: UpdateRoutineStatusCommand
  ): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.routinesApi.updateStatus({
          routineId: command.routineId,
          enabled: command.enabled,
        })
      );

      const updatedRoutine = this.routineAssembler.toEntity(response);
      this.routinesSignal.set(
        this.routinesSignal().map((routine) =>
          routine.id === command.routineId ? updatedRoutine : routine
        )
      );

      return true;
    } catch (error) {
      console.error(error);
      this.errorSignal.set('routines.updateError');
      return false;
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
