import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BaseApiService } from '../../../shared/infrastructure/api/base-api.service';

import { Invoice } from '../../domain/model/invoice.entity';
import { InvoiceAssembler } from '../assemblers/invoice.assembler';
import { InvoiceResource } from '../resources/invoice.resource';
import { InvoiceResponse } from '../responses/invoice.response';

@Injectable({
  providedIn: 'root',
})
export class InvoicesApiService extends BaseApiService<
  Invoice,
  InvoiceResource,
  InvoiceResponse
> {
  constructor(http: HttpClient) {
    super(http, 'invoices', new InvoiceAssembler());
  }

  findCurrentUserInvoices(userId: number): Observable<InvoiceResponse[]> {
    return this.http.get<InvoiceResponse[]>(
      `${this.apiBaseUrl}/invoices?userId=${userId}`
    );
  }
}
