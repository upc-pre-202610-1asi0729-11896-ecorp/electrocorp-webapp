import { BaseEntity } from '../../../shared/domain/model/base.entity';

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type SupportTicketPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'
  | 'URGENT';

export class SupportTicket extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _subject: string;
  private readonly _description: string;
  private readonly _status: SupportTicketStatus;
  private readonly _priority: SupportTicketPriority;
  private readonly _createdAt: string;

  constructor(props: {
    id: number;
    userId: number;
    subject: string;
    description: string;
    status: SupportTicketStatus;
    priority: SupportTicketPriority;
    createdAt: string;
  }) {
    super(props.id);
    this._userId = props.userId;
    this._subject = props.subject;
    this._description = props.description;
    this._status = props.status;
    this._priority = props.priority;
    this._createdAt = props.createdAt;
  }

  get userId(): number {
    return this._userId;
  }

  get subject(): string {
    return this._subject;
  }

  get description(): string {
    return this._description;
  }

  get status(): SupportTicketStatus {
    return this._status;
  }

  get priority(): SupportTicketPriority {
    return this._priority;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get isOpen(): boolean {
    return this._status === 'OPEN' || this._status === 'IN_PROGRESS';
  }

  get isCritical(): boolean {
    return (
      this._priority === 'URGENT' ||
      this._priority === 'CRITICAL' ||
      this._priority === 'HIGH'
    );
  }

  get isUrgent(): boolean {
    return this._priority === 'URGENT';
  }
}
