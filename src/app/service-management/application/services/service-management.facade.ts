import { computed, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthSessionService } from '../../../shared/application/services/auth-session.service';

import { CreateSupportTicketCommand } from '../commands/create-support-ticket.command';
import { CreateSupportTicketDto } from '../dtos/create-support-ticket.dto';
import { CreateMaintenanceTicketDto } from '../dtos/create-maintenance-ticket.dto';

import { SupportTicket } from '../../domain/model/support-ticket.entity';
import { MaintenanceTicket } from '../../domain/model/maintenance-ticket.entity';
import { TicketPriorityService } from '../../domain/services/ticket-priority.service';

import { SupportTicketsApiService } from '../../infrastructure/api/support-tickets-api.service';
import { MaintenanceTicketsApiService } from '../../infrastructure/api/maintenance-tickets-api.service';

import { SupportTicketAssembler } from '../../infrastructure/assemblers/support-ticket.assembler';
import { MaintenanceTicketAssembler } from '../../infrastructure/assemblers/maintenance-ticket.assembler';

@Injectable({
  providedIn: 'root',
})
export class ServiceManagementFacade {
  private readonly supportTicketAssembler = new SupportTicketAssembler();
  private readonly maintenanceTicketAssembler = new MaintenanceTicketAssembler();

  private readonly supportTicketsSignal = signal<SupportTicket[]>([]);
  private readonly maintenanceTicketsSignal = signal<MaintenanceTicket[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly supportTickets = computed(() => this.supportTicketsSignal());
  readonly maintenanceTickets = computed(() => this.maintenanceTicketsSignal());
  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  readonly supportTicketsSorted = computed(() => {
    return this.ticketPriorityService.sortSupportTickets(
      this.supportTicketsSignal()
    );
  });

  readonly maintenanceTicketsSorted = computed(() => {
    const statusWeight: Record<string, number> = {
      IN_PROGRESS: 1,
      PENDING: 2,
      COMPLETED: 3,
      CANCELLED: 4,
    };

    return [...this.maintenanceTicketsSignal()].sort((a, b) => {
      const byStatus = statusWeight[a.status] - statusWeight[b.status];

      if (byStatus !== 0) {
        return byStatus;
      }

      return (
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
    });
  });

  readonly totalSupportTickets = computed(() => {
    return this.supportTicketsSignal().length;
  });

  readonly openSupportTickets = computed(() => {
    return this.supportTicketsSignal().filter((ticket) => ticket.isOpen).length;
  });

  readonly criticalSupportTickets = computed(() => {
    return this.supportTicketsSignal().filter((ticket) => ticket.isCritical)
      .length;
  });

  readonly resolvedSupportTickets = computed(() => {
    return this.supportTicketsSignal().filter(
      (ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
    ).length;
  });

  readonly supportResolutionRate = computed(() => {
    const total = this.totalSupportTickets();

    if (!total) {
      return 0;
    }

    return Math.round((this.resolvedSupportTickets() / total) * 100);
  });

  readonly prioritySupportTicket = computed(() => {
    const tickets = this.supportTicketsSorted();

    return tickets.length ? tickets[0] : null;
  });

  readonly totalMaintenanceTickets = computed(() => {
    return this.maintenanceTicketsSignal().length;
  });

  readonly pendingMaintenanceTickets = computed(() => {
    return this.maintenanceTicketsSignal().filter(
      (ticket) => ticket.status === 'PENDING' || ticket.status === 'IN_PROGRESS'
    ).length;
  });

  readonly completedMaintenanceTickets = computed(() => {
    return this.maintenanceTicketsSignal().filter(
      (ticket) => ticket.status === 'COMPLETED'
    ).length;
  });

  readonly maintenanceCompletionRate = computed(() => {
    const total = this.totalMaintenanceTickets();

    if (!total) {
      return 0;
    }

    return Math.round((this.completedMaintenanceTickets() / total) * 100);
  });

  readonly nextMaintenanceTicket = computed(() => {
    const pendingTickets = this.maintenanceTicketsSorted().filter(
      (ticket) => ticket.status === 'PENDING' || ticket.status === 'IN_PROGRESS'
    );

    return pendingTickets.length ? pendingTickets[0] : null;
  });

  constructor(
    private readonly authSession: AuthSessionService,
    private readonly supportTicketsApi: SupportTicketsApiService,
    private readonly maintenanceTicketsApi: MaintenanceTicketsApiService,
    private readonly ticketPriorityService: TicketPriorityService
  ) {}

  async loadSupportTickets(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const userId = this.getCurrentUserId();

      const responses = await firstValueFrom(
        this.supportTicketsApi.findByUserId(userId)
      );

      this.supportTicketsSignal.set(
        responses.map((response) =>
          this.supportTicketAssembler.toEntity(response)
        )
      );
    } catch (error) {
      console.error(error);
      this.errorSignal.set('serviceManagement.loadSupportError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async loadMaintenanceTickets(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const responses = await firstValueFrom(
        this.maintenanceTicketsApi.findAll()
      );

      this.maintenanceTicketsSignal.set(
        responses.map((response) =>
          this.maintenanceTicketAssembler.toEntity(response)
        )
      );
    } catch (error) {
      console.error(error);
      this.errorSignal.set('serviceManagement.loadMaintenanceError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async createSupportTicket(
    payload: CreateSupportTicketDto | CreateSupportTicketCommand
  ): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const userId = this.getCurrentUserId();

      await firstValueFrom(
        this.supportTicketsApi.create({
          userId,
          subject: payload.subject,
          description: payload.description,
          priority: payload.priority,
          status: 'status' in payload ? payload.status ?? 'OPEN' : 'OPEN',
          createdAt: new Date().toISOString().slice(0, 10),
        })
      );

      await this.loadSupportTickets();
      return true;
    } catch (error) {
      console.error(error);
      this.errorSignal.set('serviceManagement.createSupportError');
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async createMaintenanceTicket(
    payload: CreateMaintenanceTicketDto
  ): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      await firstValueFrom(
        this.maintenanceTicketsApi.create({
          deviceId: payload.deviceId,
          title: payload.title,
          description: payload.description,
          scheduledAt: payload.scheduledAt,
          status: payload.status ?? 'PENDING',
        })
      );

      await this.loadMaintenanceTickets();
    } catch (error) {
      console.error(error);
      this.errorSignal.set('serviceManagement.createMaintenanceError');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  private getCurrentUserId(): number {
    const userId = this.authSession.userId();

    if (!userId) {
      throw new Error('Authenticated user id was not found.');
    }

    return userId;
  }
}
