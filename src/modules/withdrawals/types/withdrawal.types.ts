import { Withdrawal } from '@prisma/client';

export interface WithdrawalWithRelations extends Withdrawal {
  user?: {
    id: number;
    name: string;
    email: string;
    userProfile?: {
      avatar: string | null;
      expertise: string | null;
      bio: string | null;
    } | null;
  } | null;
  processedByUser?: {
    id: number;
    name: string;
    email: string;
    userProfile?: {
      avatar: string | null;
      expertise: string | null;
      bio: string | null;
    } | null;
  } | null;
}
