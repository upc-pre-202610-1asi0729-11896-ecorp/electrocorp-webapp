import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';

export interface DeviceAssignmentResponse extends BaseResponse<number> {
  deviceId: number;
  userId: number;
  locationId: number;
  roomId: number | null;
  assignedAt: string;
}
