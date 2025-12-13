export class LatestTransactionDto {
  id: number;
  orderId: string;
  amount: number;
  status: string;
  paymentMethod: string | null;
  transactionDate: Date;
  course: {
    id: number;
    title: string;
    image: string | null;
  };
  student: {
    id: number;
    name: string;
    email: string;
  };
}

export class LatestCourseDto {
  id: number;
  title: string;
  status: string;
  totalLessons: number;
  createdAt: Date;
  image: string | null;
  subject: {
    id: number;
    name: string;
  };
}

export class LatestUserDto {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  role: {
    id: number;
    name: string;
    key: string;
  };
}
