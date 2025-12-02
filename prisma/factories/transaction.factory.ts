import { faker } from '@faker-js/faker';
import { PrismaClient, TransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class TransactionFactory {
  static async create(data: {
    studentId: number;
    courseId: number;
    basePrice: number;
    status?: TransactionStatus;
  }) {
    const basePrice = Number(data.basePrice);
    const ppnRate = 0.11; // 11% PPN
    const ppnAmount = basePrice * ppnRate;
    const platformFeeRate = 0.05; // 5% platform fee
    const platformFee = basePrice * platformFeeRate;
    const grossAmount = basePrice + ppnAmount;
    const mentorNetAmount = basePrice - platformFee;

    const status = data.status || faker.helpers.arrayElement(['PENDING', 'PAID', 'EXPIRED']);
    const orderId = `TRX-${Date.now()}-${faker.string.alphanumeric(6).toUpperCase()}`;

    return prisma.transaction.create({
      data: {
        studentId: data.studentId,
        courseId: data.courseId,
        amount: grossAmount,
        basePrice,
        ppnAmount,
        ppnRate,
        platformFee,
        platformFeeRate,
        mentorNetAmount,
        status,
        paymentMethod: status === 'PAID' ? faker.helpers.arrayElement(['bank_transfer', 'credit_card', 'gopay', 'shopeepay']) : null,
        orderId,
        snapToken: status === 'PENDING' ? faker.string.alphanumeric(64) : null,
        snapRedirectUrl: status === 'PENDING' ? `https://app.sandbox.midtrans.com/snap/v2/vtweb/${faker.string.alphanumeric(32)}` : null,
        grossAmount,
        currency: 'IDR',
        paidAt: status === 'PAID' ? faker.date.past() : null,
        expiredAt: status === 'PENDING' ? faker.date.future() : null,
      },
    });
  }

  static async createPaid(data: {
    studentId: number;
    courseId: number;
    basePrice: number;
  }) {
    return this.create({ ...data, status: 'PAID' });
  }

  static async createMany(count: number, studentId: number, courseIds: number[], coursePrices: number[]) {
    const transactions: Awaited<ReturnType<typeof this.create>>[] = [];
    for (let i = 0; i < count; i++) {
      const courseId = faker.helpers.arrayElement(courseIds);
      const index = courseIds.indexOf(courseId);
      const basePrice = coursePrices[index];

      transactions.push(await this.create({ studentId, courseId, basePrice }));
    }
    return transactions;
  }
}