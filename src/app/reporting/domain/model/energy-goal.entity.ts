import { BaseEntity } from '../../../shared/domain/model/base.entity';

export type EnergyGoalStatus = 'IN_PROGRESS' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
export type EnergyGoalScopeType =
  | 'GENERAL'
  | 'WORKPLACE'
  | 'ROOM'
  | 'DEVICE'
  | 'GROUP';

export class EnergyGoal extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _title: string;
  private readonly _targetKilowattHours: number;
  private readonly _currentKilowattHours: number;
  private readonly _startDate: string;
  private readonly _endDate: string;
  private readonly _deadline: string;
  private readonly _status: EnergyGoalStatus;
  private readonly _createdAt: string;
  private readonly _scopeType: EnergyGoalScopeType;
  private readonly _scopeId: number | null;
  private readonly _scopeName: string;
  private readonly _activeFrom: string | null;
  private readonly _activeTo: string | null;

  constructor(props: {
    id: number;
    userId: number;
    title: string;
    targetWatts?: number;
    currentWatts?: number;
    startDate?: string;
    endDate?: string;
    targetKilowattHours?: number;
    currentKilowattHours?: number;
    deadline?: string;
    status: EnergyGoalStatus;
    createdAt?: string;
    scopeType?: EnergyGoalScopeType | null;
    scopeId?: number | null;
    scopeName?: string | null;
    activeFrom?: string | null;
    activeTo?: string | null;
  }) {
    super(props.id);
    const targetKilowattHours =
      props.targetKilowattHours ?? Number(props.targetWatts ?? 0) / 1000;
    const currentKilowattHours =
      props.currentKilowattHours ?? Number(props.currentWatts ?? 0) / 1000;

    this._userId = props.userId;
    this._title = props.title;
    this._targetKilowattHours = targetKilowattHours;
    this._currentKilowattHours = currentKilowattHours;
    this._deadline = props.deadline ?? props.endDate ?? '';
    this._createdAt = props.createdAt ?? props.startDate ?? '';
    this._startDate = props.startDate ?? props.activeFrom ?? this._createdAt;
    this._endDate = props.endDate ?? this._deadline;
    this._status = props.status;
    this._scopeType = props.scopeType ?? 'GENERAL';
    this._scopeId = props.scopeId ?? null;
    this._scopeName = props.scopeName ?? 'Toda la operacion';
    this._activeFrom = props.activeFrom ?? null;
    this._activeTo = props.activeTo ?? null;
  }

  get userId(): number {
    return this._userId;
  }

  get title(): string {
    return this._title;
  }

  get targetKilowattHours(): number {
    return this._targetKilowattHours;
  }

  get currentKilowattHours(): number {
    return this._currentKilowattHours;
  }

  get targetWatts(): number {
    return Math.round(this._targetKilowattHours * 1000);
  }

  get currentWatts(): number {
    return Math.round(this._currentKilowattHours * 1000);
  }

  get startDate(): string {
    return this._startDate;
  }

  get endDate(): string {
    return this._endDate;
  }

  get deadline(): string {
    return this._deadline;
  }

  get status(): EnergyGoalStatus {
    return this._status;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get scopeType(): EnergyGoalScopeType {
    return this._scopeType;
  }

  get scopeId(): number | null {
    return this._scopeId;
  }

  get scopeName(): string {
    return this._scopeName;
  }

  get activeFrom(): string | null {
    return this._activeFrom;
  }

  get activeTo(): string | null {
    return this._activeTo;
  }

  get activeWindowLabel(): string {
    if (!this._activeFrom || !this._activeTo) {
      return 'Todo el dia';
    }

    return `${this._activeFrom} - ${this._activeTo}`;
  }

  get progressPercentage(): number {
    if (this._targetKilowattHours <= 0) return 0;

    const progress =
      (this._currentKilowattHours / this._targetKilowattHours) * 100;
    return Math.min(Math.round(progress), 100);
  }

  get remainingWatts(): number {
    return Math.max(this.targetWatts - this.currentWatts, 0);
  }

  get isActive(): boolean {
    return this._status === 'ACTIVE' || this._status === 'IN_PROGRESS';
  }

  get isCompleted(): boolean {
    return this._status === 'COMPLETED';
  }

  get isFailed(): boolean {
    return this._status === 'FAILED';
  }
}
