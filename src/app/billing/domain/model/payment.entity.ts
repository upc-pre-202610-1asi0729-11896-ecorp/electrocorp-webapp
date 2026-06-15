import { BaseEntity } from '../../../shared/domain/model/base.entity';
import { PlanCode } from './plan.entity';

export type PaymentMethod = 'CARD';
export type PaymentStatus = 'APPROVED' | 'REJECTED' | 'PENDING';

export class Payment extends BaseEntity<number> {
  private readonly _userId: number;
  private readonly _planCode: PlanCode;
  private readonly _amount: number;
  private readonly _method: PaymentMethod;
  private readonly _status: PaymentStatus;
  private readonly _createdAt: string;
  private readonly _cardLastFourDigits: string;
  private readonly _holderName: string;

  constructor(props: {
    id: number;
    userId: number;
    planCode: PlanCode;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    createdAt: string;
    cardLastFourDigits: string;
    holderName: string;
  }) {
    super(props.id);
    this._userId = props.userId;
    this._planCode = props.planCode;
    this._amount = props.amount;
    this._method = props.method;
    this._status = props.status;
    this._createdAt = props.createdAt;
    this._cardLastFourDigits = props.cardLastFourDigits;
    this._holderName = props.holderName;
  }

  get userId(): number {
    return this._userId;
  }

  get planCode(): PlanCode {
    return this._planCode;
  }

  get amount(): number {
    return this._amount;
  }

  get method(): PaymentMethod {
    return this._method;
  }

  get status(): PaymentStatus {
    return this._status;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get cardLastFourDigits(): string {
    return this._cardLastFourDigits;
  }

  get holderName(): string {
    return this._holderName;
  }

  get isApproved(): boolean {
    return this._status === 'APPROVED';
  }
}
