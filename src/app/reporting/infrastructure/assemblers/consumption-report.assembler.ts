import { BaseAssembler } from '../../../shared/infrastructure/assemblers/base.assembler';
import { ConsumptionReport } from '../../domain/model/consumption-report.entity';
import { ConsumptionReportResource } from '../resources/consumption-report.resource';
import { ConsumptionReportResponse } from '../responses/consumption-report.response';

export class ConsumptionReportAssembler extends BaseAssembler<
  ConsumptionReport,
  ConsumptionReportResource,
  ConsumptionReportResponse
> {
  override toEntity(response: ConsumptionReportResponse): ConsumptionReport {
    return new ConsumptionReport({
      id: response.id,
      userId: response.userId,
      title: response.title,
      period: response.period,
      startDate: response.startDate,
      endDate: response.endDate,
      totalWatts: response.totalWatts,
      averageWatts: response.averageWatts,
      highestWatts: response.highestWatts,
      highestReading: response.highestReading,
      recommendation: response.recommendation,
      generatedAt: response.generatedAt,
    });
  }

  override toResource(entity: ConsumptionReport): ConsumptionReportResource {
    return {
      userId: entity.userId,
      title: entity.title,
      period: entity.period,
      startDate: entity.startDate,
      endDate: entity.endDate,
      totalWatts: entity.totalWatts,
      averageWatts: entity.averageWatts,
      highestWatts: entity.highestWatts,
      highestReading: entity.highestReading,
      recommendation: entity.recommendation,
      generatedAt: entity.generatedAt,
    };
  }
}
