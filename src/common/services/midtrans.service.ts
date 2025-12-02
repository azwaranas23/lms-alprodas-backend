import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as midtransClient from 'midtrans-client';
import * as crypto from 'crypto';

interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}

interface MidtransTransactionParameter {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  customer_details: {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  item_details?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
}

@Injectable()
export class MidtransService {
  private snap: midtransClient.Snap;
  private core: midtransClient.CoreApi;
  private serverKey: string;

  constructor(private configService: ConfigService) {
    const isProduction =
      this.configService.get<string>('MIDTRANS_IS_PRODUCTION') === 'true';
    this.serverKey =
      this.configService.get<string>('MIDTRANS_SERVER_KEY') || '';
    const clientKey =
      this.configService.get<string>('MIDTRANS_CLIENT_KEY') || '';

    if (!this.serverKey || !clientKey) {
      throw new Error('Midtrans server key or client key is not configured');
    }

    this.snap = new midtransClient.Snap({
      isProduction: isProduction,
      serverKey: this.serverKey,
      clientKey: clientKey,
    });

    this.core = new midtransClient.CoreApi({
      isProduction: isProduction,
      serverKey: this.serverKey,
      clientKey: clientKey,
    });
  }

  async createTransaction(
    parameter: MidtransTransactionParameter,
  ): Promise<{ token: string; redirect_url: string }> {
    return await this.snap.createTransaction(
      parameter as midtransClient.SnapTransactionParameters,
    );
  }

  async getTransactionStatus(orderId: string): Promise<any> {
    return await (this.core as any).status(orderId);
  }

  verifySignature(notification: MidtransNotification): boolean {
    const { order_id, status_code, gross_amount, signature_key } = notification;

    const hash = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${this.serverKey}`)
      .digest('hex');

    return hash === signature_key;
  }
}
