import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';
import {
  Device,
  DeviceStatus,
} from '../../domain/model/device.entity';
import { DeviceAssembler } from '../assemblers/device.assembler';
import { DeviceResource } from '../resources/device.resource';
import { DeviceResponse } from '../responses/device.response';

@Injectable({
  providedIn: 'root',
})
export class DevicesApiService extends BaseApiService<
  Device,
  DeviceResource,
  DeviceResponse
> {
  constructor(http: HttpClient) {
    super(http, 'devices', new DeviceAssembler());
  }

  updateStatus(payload: {
    deviceId: number;
    status: DeviceStatus;
  }): Observable<DeviceResponse> {
    return this.http.patch<DeviceResponse>(
      `${this.apiBaseUrl}/devices/${payload.deviceId}`,
      { status: payload.status }
    );
  }
}
