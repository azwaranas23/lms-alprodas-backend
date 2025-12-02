import { WithdrawalStatus } from '@prisma/client';

export class WithdrawalsResponseDto {
  id: number;
  userId: number;
  amount: number;
  status: WithdrawalStatus;
  withdrawalCode: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  processedBy: number | null;
  proofPaymentWithdrawal: string | null;
  requestedAt: Date;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    expertise: string | null;
    bio: string | null;
  } | null;
  processedByUser: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    expertise: string | null;
    bio: string | null;
  } | null;
}
