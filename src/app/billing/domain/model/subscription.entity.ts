import { BaseEntity } from '../../../shared/domain/model/base.entity';
import { PlanCode } from './plan.entity';

export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

export class Subscription extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _planCode: PlanCode;
  private readonly _status: SubscriptionStatus;
  private readonly _active: boolean;

  constructor(props: {
    id: number;
    userId: number;
    planCode: PlanCode;
    status: SubscriptionStatus;
    active: boolean;
  }) {
    super(props.id);
    this._userId = props.userId;
    this._planCode = props.planCode;
    this._status = props.status;
    this._active = props.active;
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

  get active(): boolean {
    return this._active;
  }

  get isActive(): boolean {
    return this._active;
  }
}