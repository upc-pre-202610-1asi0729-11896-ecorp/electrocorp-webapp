import { Injectable } from '@angular/core';

import {
  SupportTicket,
  SupportTicketPriority,
} from '../model/support-ticket.entity';
import {
  MaintenanceTicket,
  MaintenanceTicketStatus,
} from '../model/maintenance-ticket.entity';

@Injectable({
  providedIn: 'root',
})
export class TicketPriorityService {
  private readonly supportPriorityWeight: Record<SupportTicketPriority, number> = {
    URGENT: 1,
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4,
  };

  private readonly maintenanceStatusWeight: Record<string, number> = {
    IN_PROGRESS: 1,
    PENDING: 2,
    SCHEDULED: 2,
    COMPLETED: 3,
    CANCELLED: 4,
    CANCELED: 4,
  };

  sortSupportTickets(tickets: SupportTicket[]): SupportTicket[] {
    return [...tickets].sort((first, second) => {
      const priorityDifference =
        this.supportPriorityWeight[first.priority] -
        this.supportPriorityWeight[second.priority];

      if (priorityDifference !== 0) return priorityDifference;

      return (
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
      );
    });
  }

  sortMaintenanceTickets(tickets: MaintenanceTicket[]): MaintenanceTicket[] {
    return [...tickets].sort((first, second) => {
      const statusDifference =
        this.getMaintenanceStatusWeight(first.status) -
        this.getMaintenanceStatusWeight(second.status);

      if (statusDifference !== 0) return statusDifference;

      return (
        new Date(first.scheduledAt).getTime() -
        new Date(second.scheduledAt).getTime()
      );
    });
  }

  getSupportPriorityWeight(priority: SupportTicketPriority): number {
    return this.supportPriorityWeight[priority];
  }

  getMaintenanceStatusWeight(status: MaintenanceTicketStatus): number {
    return this.maintenanceStatusWeight[status] ?? 99;
  }
}
