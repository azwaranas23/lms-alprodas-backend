export interface CompleteCourseResponseDto {
  id: number;
  studentId: number;
  courseId: number;
  status: string;
  progressPercentage: number;
  enrolledAt: Date;
  completedAt: Date;
  certificateId: string;
  course: {
    id: number;
    title: string;
    description: string | null;
    about: string | null;
    tools: string | null;
    price: number;
    status: string;
    totalLessons: number;
    totalStudents: number;
    createdAt: Date;
    updatedAt: Date;
    subject: {
      id: number;
      name: string;
      topic: {
        id: number;
        name: string;
      };
    };
    mentor: {
      id: number;
      email: string;
      name: string;
      profile: {
        bio: string | null;
        avatar: string | null;
        expertise: string | null;
      } | null;
    };
    images: {
      id: number;
      imagePath: string;
      orderIndex: number | null;
    }[];
    sections: {
      id: number;
      title: string;
      description: string | null;
      orderIndex: number;
      totalLessons: number;
      lessons: {
        id: number;
        title: string;
        contentType: string;
        contentUrl: string | null;
        contentText: string | null;
        durationMinutes: number;
        orderIndex: number;
        isActive: boolean;
      }[];
    }[];
  };
}
