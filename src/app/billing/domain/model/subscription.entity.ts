import { BaseEntity } from '../../../shared/domain/model/base.entity';
import { PlanCode } from './plan.entity';

export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

export class Subscription extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _planCode: PlanCode;
  private readonly _status: SubscriptionStatus;
  private readonly _startedAt: string;
  private readonly _endsAt: string | null;

  constructor(props: {
    id: number;
    userId: number;
    planCode: PlanCode;
    status: SubscriptionStatus;
    startedAt: string;
    endsAt: string | null;
  }) {
    super(props.id);
    this._userId = props.userId;
    this._planCode = props.planCode;
    this._status = props.status;
    this._startedAt = props.startedAt;
    this._endsAt = props.endsAt;
  }

  get userId(): number {
    return this._userId;
  }

  get planCode(): PlanCode {
    return this._planCode;
  }

  get status(): SubscriptionStatus {
    return this._status;
  }

  get startedAt(): string {
    return this._startedAt;
  }

  get endsAt(): string | null {
    return this._endsAt;
  }

  get isActive(): boolean {
    return this._status === 'ACTIVE';
  }
}
