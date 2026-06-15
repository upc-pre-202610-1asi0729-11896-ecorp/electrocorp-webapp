import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';
import { MaintenanceTicket } from '../../domain/model/maintenance-ticket.entity';
import { MaintenanceTicketAssembler } from '../assemblers/maintenance-ticket.assembler';
import { MaintenanceTicketResource } from '../resources/maintenance-ticket.resource';
import { MaintenanceTicketResponse } from '../responses/maintenance-ticket.response';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceTicketsApiService extends BaseApiService<
  MaintenanceTicket,
  MaintenanceTicketResource,
  MaintenanceTicketResponse
> {
  constructor(http: HttpClient) {
    super(http, 'maintenanceTickets', new MaintenanceTicketAssembler());
  }

  updateStatus(
    ticketId: number,
    resource: Partial<MaintenanceTicketResource>
  ): Observable<MaintenanceTicketResponse> {
    return this.update(ticketId, resource);
  }
}
