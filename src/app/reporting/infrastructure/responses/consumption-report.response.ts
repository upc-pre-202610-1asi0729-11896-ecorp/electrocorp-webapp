import { BaseResponse } from '../../../shared/infrastructure/responses/base.response';
import { ConsumptionReportPeriod } from '../../domain/model/consumption-report.entity';

export interface ConsumptionReportResponse extends BaseResponse<number> {
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
