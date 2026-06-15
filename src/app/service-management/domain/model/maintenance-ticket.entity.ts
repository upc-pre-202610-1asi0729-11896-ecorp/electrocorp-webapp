import { BaseEntity } from '../../../shared/domain/model/base.entity';

export type MaintenanceTicketStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CANCELED';
export type MaintenanceTicketType =
  | 'INSPECTION'
  | 'REPAIR'
  | 'REPLACEMENT'
  | 'INSTALLATION';

export class MaintenanceTicket extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _deviceId: number;
  private readonly _deviceName: string;
  private readonly _type: MaintenanceTicketType;
  private readonly _title: string;
  private readonly _description: string;
  private readonly _status: MaintenanceTicketStatus;
  private readonly _scheduledAt: string;
  private readonly _createdAt: string;

  constructor(props: {
    id: number;
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
  }) {
    super(props.id);
    this._userId = props.userId ?? 0;
    this._deviceId = props.deviceId;
    this._deviceName = props.deviceName ?? props.title ?? `Device ${props.deviceId}`;
    this._type = props.type ?? 'INSPECTION';
    this._title = props.title ?? `${this._type} - ${this._deviceName}`;
    this._description = props.description;
    this._status = props.status;
    this._scheduledAt = props.scheduledAt ?? props.scheduledDate ?? '';
    this._createdAt = props.createdAt ?? this._scheduledAt;
  }

  get userId(): number {
    return this._userId;
  }

  get deviceId(): number {
    return this._deviceId;
  }

  get deviceName(): string {
    return this._deviceName;
  }

  get type(): MaintenanceTicketType {
    return this._type;
  }

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get status(): MaintenanceTicketStatus {
    return this._status;
  }

  get scheduledAt(): string {
    return this._scheduledAt;
  }

  get scheduledDate(): string {
    return this._scheduledAt;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get isPending(): boolean {
    return (
      this._status === 'PENDING' ||
      this._status === 'SCHEDULED' ||
      this._status === 'IN_PROGRESS'
    );
  }

  get isCompleted(): boolean {
    return this._status === 'COMPLETED';
  }

  get isCanceled(): boolean {
    return this._status === 'CANCELED' || this._status === 'CANCELLED';
  }
}
