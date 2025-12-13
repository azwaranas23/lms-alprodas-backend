export interface UsersListResponseDto {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  roleName: string;
  userProfile: UserProfileResponse | null;
  enrolledCoursesCount?: number | null;
  createdCoursesCount?: number | null;
  totalRevenue?: number | null;
}

interface UserProfileResponse {
  id: number;
  bio: string | null;
  avatar: string | null;
  gender: string | null;
}
