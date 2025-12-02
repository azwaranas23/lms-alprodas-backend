export class CheckoutResponseDto {
  orderId: string;
  snapToken: string;
  redirectUrl: string;
  basePrice: number;
  ppnAmount: number;
  totalAmount: number;
  currency: string;
  status: string;
  expiresAt: Date;
  platformFee: number;
  mentorNetAmount: number;
  course: {
    id: number;
    title: string;
    price: number;
  };
  customer: {
    name: string;
    email: string;
  };
}

export class WebhookResponseDto {
  success: boolean;
}

export class TransactionListResponseDto {
  id: number;
  orderId: string;
  amount: number;
  basePrice: number;
  ppnAmount: number;
  ppnRate: number;
  platformFee: number;
  platformFeeRate: number;
  mentorNetAmount: number;
  status: string;
  paymentMethod: string | null;
  currency: string;
  transactionDate: Date;
  paidAt: Date | null;
  expiredAt: Date | null;
  course: {
    id: number;
    title: string;
    price: number;
    image: string | null;
    subject: {
      id: number;
      name: string;
    };
    mentor: {
      id: number;
      name: string;
      email: string;
      profile: {
        bio: string | null;
        avatar: string | null;
        gender: string | null;
        expertise: string | null;
        experienceYears: number | null;
        linkedinUrl: string | null;
        githubUrl: string | null;
      } | null;
    };
  };
  student: {
    id: number;
    name: string;
    email: string;
    profile: {
      bio: string | null;
      avatar: string | null;
      gender: string | null;
      expertise: string | null;
      experienceYears: number | null;
      linkedinUrl: string | null;
      githubUrl: string | null;
    } | null;
  };
}

export class TransactionDetailResponseDto {
  id: number;
  orderId: string;
  amount: number;
  basePrice: number;
  ppnAmount: number;
  ppnRate: number;
  platformFee: number;
  platformFeeRate: number;
  mentorNetAmount: number;
  status: string;
  paymentMethod: string | null;
  snapToken: string | null;
  snapRedirectUrl: string | null;
  grossAmount: number;
  currency: string;
  transactionDate: Date;
  paidAt: Date | null;
  expiredAt: Date | null;
  course: {
    id: number;
    title: string;
    description: string | null;
    price: number;
    subject: {
      id: number;
      name: string;
    };
    mentor: {
      id: number;
      name: string;
      email: string;
      profile: {
        bio: string | null;
        avatar: string | null;
        gender: string | null;
        expertise: string | null;
        experienceYears: number | null;
        linkedinUrl: string | null;
        githubUrl: string | null;
      } | null;
    };
  };
  student: {
    id: number;
    name: string;
    email: string;
    profile: {
      bio: string | null;
      avatar: string | null;
      gender: string | null;
      expertise: string | null;
      experienceYears: number | null;
      linkedinUrl: string | null;
      githubUrl: string | null;
    } | null;
  };
}
