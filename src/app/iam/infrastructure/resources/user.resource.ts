import { BaseResource } from '../../../shared/infrastructure/resources/base.resource';
import { UserStatus } from '../../domain/model/user.entity';

export interface UserResource extends BaseResource {
  fullName: string;
  email: string;
  status: UserStatus;
}
