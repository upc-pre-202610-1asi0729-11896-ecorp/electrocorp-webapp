import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';
import { ConsumptionReportPeriod } from '../../domain/model/consumption-report.entity';

export interface ConsumptionReportResource extends BaseResource {
  userId: number;
  title?: string;
  period?: ConsumptionReportPeriod;
  startDate: string;
  endDate: string;
  totalWatts: number;
  averageWatts: number;
  highestWatts?: number;
  highestReading?: number;
  recommendation?: string;
  generatedAt?: string;
}
