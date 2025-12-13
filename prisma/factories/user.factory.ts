import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class UserFactory {
  static async create(data?: {
    email?: string;
    name?: string;
    roleId?: number;
    isVerified?: boolean;
    isActive?: boolean;
  }) {
    const hashedPassword = await bcrypt.hash('password123', 10);

    return prisma.user.create({
      data: {
        email: data?.email || faker.internet.email().toLowerCase(),
        password: hashedPassword,
        name: data?.name || faker.person.fullName(),
        roleId: data?.roleId || 1,
        isVerified: data?.isVerified ?? true,
        isActive: data?.isActive ?? true,
      },
    });
  }

  static async createMany(count: number, roleId?: number) {
    const users: Awaited<ReturnType<typeof this.create>>[] = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.create({ roleId }));
    }
    return users;
  }

  static async createWithProfile(data?: {
    email?: string;
    name?: string;
    roleId?: number;
    bio?: string;
    gender?: 'MALE' | 'FEMALE';
  }) {
    const user = await this.create(data);

    await prisma.userProfile.create({
      data: {
        userId: user.id,
        bio: data?.bio || faker.lorem.paragraph(),
        avatar: faker.image.avatar(),
        gender: data?.gender || faker.helpers.arrayElement(['MALE', 'FEMALE']),
      },
    });

    return prisma.user.findUnique({
      where: { id: user.id },
      include: { userProfile: true },
    });
  }
}
