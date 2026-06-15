import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';
import { AccessProfileName } from '../../domain/model/access-profile.entity';

export interface AccessProfileResource extends BaseResource {
  name: AccessProfileName;
  description: string;
}