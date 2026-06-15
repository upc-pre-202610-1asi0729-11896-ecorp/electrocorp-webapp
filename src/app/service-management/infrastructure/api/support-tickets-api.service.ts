import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';
import { SupportTicket } from '../../domain/model/support-ticket.entity';
import { SupportTicketAssembler } from '../assemblers/support-ticket.assembler';
import { SupportTicketResource } from '../resources/support-ticket.resource';
import { SupportTicketResponse } from '../responses/support-ticket.response';

@Injectable({
  providedIn: 'root',
})
export class SupportTicketsApiService extends BaseApiService<
  SupportTicket,
  SupportTicketResource,
  SupportTicketResponse
> {
  constructor(http: HttpClient) {
    super(http, 'supportTickets', new SupportTicketAssembler());
  }

  findByUserId(userId: number): Observable<SupportTicketResponse[]> {
    return this.http.get<SupportTicketResponse[]>(
      `${this.apiBaseUrl}/supportTickets?userId=${userId}`
    );
  }

  updateStatus(
    ticketId: number,
    resource: Partial<SupportTicketResource>
  ): Observable<SupportTicketResponse> {
    return this.update(ticketId, resource);
  }
}
