export interface CreateTransactionData {
  studentId: number;
  courseId: number;
  amount: number;
  basePrice: number;
  ppnAmount: number;
  ppnRate: number;
  orderId: string;
  snapToken: string;
  snapRedirectUrl: string;
  expiredAt?: Date;
  platformFee: number;
  platformFeeRate: number;
  mentorNetAmount: number;
}
