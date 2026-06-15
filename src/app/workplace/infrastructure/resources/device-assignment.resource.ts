import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';

export interface DeviceAssignmentResource extends BaseResource {
  deviceId: number;
  userId: number;
  locationId: number;
  roomId: number | null;
  assignedAt: string;
}
