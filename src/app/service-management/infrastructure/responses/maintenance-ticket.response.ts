import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';
import {
  MaintenanceTicketStatus,
  MaintenanceTicketType,
} from '../../domain/model/maintenance-ticket.entity';

export interface MaintenanceTicketResponse extends BaseResponse<number> {
  userId?: number;
  deviceId: number;
  deviceName?: string;
  type?: MaintenanceTicketType;
  title?: string;
  description: string;
  status: MaintenanceTicketStatus;
  scheduledAt?: string;
  scheduledDate?: string;
  createdAt?: string;
}
