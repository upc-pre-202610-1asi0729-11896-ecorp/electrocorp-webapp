import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';
import { MaintenanceTicket } from '../../domain/model/maintenance-ticket.entity';
import { MaintenanceTicketResource } from '../resources/maintenance-ticket.resource';
import { MaintenanceTicketResponse } from '../responses/maintenance-ticket.response';

export class MaintenanceTicketAssembler extends BaseAssembler<
  MaintenanceTicket,
  MaintenanceTicketResource,
  MaintenanceTicketResponse
> {
  override toEntity(response: MaintenanceTicketResponse): MaintenanceTicket {
    return new MaintenanceTicket({
      id: response.id,
      userId: response.userId,
      deviceId: response.deviceId,
      deviceName: response.deviceName,
      type: response.type,
      title: response.title,
      description: response.description,
      status: response.status,
      scheduledAt: response.scheduledAt,
      scheduledDate: response.scheduledDate,
      createdAt: response.createdAt,
    });
  }

  override toResource(entity: MaintenanceTicket): MaintenanceTicketResource {
    return {
      userId: entity.userId,
      deviceId: entity.deviceId,
      deviceName: entity.deviceName,
      type: entity.type,
      title: entity.title,
      description: entity.description,
      status: entity.status,
      scheduledAt: entity.scheduledAt,
      scheduledDate: entity.scheduledDate,
      createdAt: entity.createdAt,
    };
  }
}
