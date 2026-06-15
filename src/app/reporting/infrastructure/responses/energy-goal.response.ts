import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';
import {
  EnergyGoalScopeType,
  EnergyGoalStatus,
} from '../../domain/model/energy-goal.entity';

export interface EnergyGoalResponse extends BaseResponse<number> {
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
  scopeType?: EnergyGoalScopeType;
  scopeId?: number | null;
  scopeName?: string | null;
  activeFrom?: string | null;
  activeTo?: string | null;
}
