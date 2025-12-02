export interface UsersResponseDto {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  role: RoleResponseDto;
  userProfile: UserProfileResponseDto | null;
  totalStudents?: number;
  totalCourses?: number;
  totalEnrolledCourses?: number;
}

interface RoleResponseDto {
  id: number;
  name: string;
  key: string;
  permissions: PermissionsResponseDto[];
}

interface PermissionsResponseDto {
  id: number;
  name: string;
  key: string;
  resource: string;
}

interface UserProfileResponseDto {
  id: number;
  bio: string | null;
  avatar: string | null;
  gender: string | null;
  expertise: string | null;
  experienceYears: number | null;
  linkedInUrl: string | null;
  githubUrl: string | null;
}
