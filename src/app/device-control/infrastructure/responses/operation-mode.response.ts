import { OperationModeRoutine, OperationModeStatus } from '../../domain/model/operation-mode.entity';

export interface OperationModeResponse {
  id: number;
  userId: number;
  locationId: number;
  name: string;
  description: string;
  status: OperationModeStatus;
  roomIds: number[];
  groupIds: number[];
  deviceIds: number[];
  turnOnDeviceIds: number[];
  turnOffDeviceIds: number[];
  keepOnDeviceIds: number[];
  routineIds: number[];
  routinesToEnableIds: number[];
  routinesToDisableIds: number[];
  goalIds: number[];
  internalRoutines: OperationModeRoutine[];
  allDay: boolean;
  startsAt: string;
  endsAt: string;
  ruleProfileId: number | null;
  preferenceId: number | null;
  applyRuleProfile: boolean;
  applyNotificationPreference: boolean;
  applyRoutines: boolean;
  preserveCriticalSound: boolean;
  lastActivatedAt: string | null;
}
