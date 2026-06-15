import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';
import { EnergyGoal } from '../../domain/model/energy-goal.entity';
import { EnergyGoalResource } from '../resources/energy-goal.resource';
import { EnergyGoalResponse } from '../responses/energy-goal.response';

export class EnergyGoalAssembler extends BaseAssembler<
  EnergyGoal,
  EnergyGoalResource,
  EnergyGoalResponse
> {
  override toEntity(response: EnergyGoalResponse): EnergyGoal {
    return new EnergyGoal({
      id: response.id,
      userId: response.userId,
      title: response.title,
      targetWatts: response.targetWatts,
      currentWatts: response.currentWatts,
      startDate: response.startDate,
      endDate: response.endDate,
      targetKilowattHours: response.targetKilowattHours,
      currentKilowattHours: response.currentKilowattHours,
      deadline: response.deadline,
      status: response.status,
      createdAt: response.createdAt,
      scopeType: response.scopeType,
      scopeId: response.scopeId,
      scopeName: response.scopeName,
      activeFrom: response.activeFrom,
      activeTo: response.activeTo,
    });
  }

  override toResource(entity: EnergyGoal): EnergyGoalResource {
    return {
      userId: entity.userId,
      title: entity.title,
      targetWatts: entity.targetWatts,
      currentWatts: entity.currentWatts,
      startDate: entity.startDate,
      endDate: entity.endDate,
      targetKilowattHours: entity.targetKilowattHours,
      currentKilowattHours: entity.currentKilowattHours,
      deadline: entity.deadline,
      status: entity.status,
      createdAt: entity.createdAt,
      scopeType: entity.scopeType,
      scopeId: entity.scopeId,
      scopeName: entity.scopeName,
      activeFrom: entity.activeFrom,
      activeTo: entity.activeTo,
    };
  }
}
