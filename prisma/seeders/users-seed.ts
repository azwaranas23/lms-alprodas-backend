import { Gender, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface UserData {
  name: string;
  email: string;
  password: string;
  roleKey: string;
  firstName?: string;
  bio?: string;
  avatar?: string;
  gender?: string;
  expertise?: string;
  experienceYears?: number;
  linkedinUrl?: string;
  githubUrl?: string;
}

interface UsersJsonData {
  data: UserData[];
}

export async function usersSeed() {
  const usersPath = path.resolve(__dirname, 'data', 'users.json');
  const usersRaw = fs.readFileSync(usersPath, 'utf-8');
  const usersJson = JSON.parse(usersRaw) as UsersJsonData;
  const users = usersJson.data;

  for (const user of users) {
    const role = await prisma.role.findFirst({
      where: { key: user.roleKey },
    });

    if (!role) {
      console.warn(
        `⚠️  Role with key "${user.roleKey}" not found. Skipping user "${user.firstName || user.name}" (${user.email}).`,
      );
      continue;
    }

    const hashedPassword = await bcrypt.hash(user.password, 12);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        roleId: role.id,
        isVerified: true,
        userProfile: {
          create: {
            bio:
              user.bio ||
              `I am a ${user.roleKey} with expertise in various technologies.`,
            avatar:
              user.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
            gender: (user.gender as Gender) || ('MALE' as Gender),
            expertise:
              user.expertise ||
              (user.roleKey === 'mentor'
                ? 'Full Stack Development'
                : 'Learning'),
            experienceYears:
              user.experienceYears || (user.roleKey === 'mentor' ? 5 : 0),
            linkedinUrl:
              user.linkedinUrl ||
              `https://linkedin.com/in/${user.name.toLowerCase().replace(' ', '-')}`,
            githubUrl:
              user.githubUrl ||
              `https://github.com/${user.name.toLowerCase().replace(' ', '-')}`,
          },
        },
      },
    });

    console.log(`✅ User for role "${user.roleKey}" seeded`);
  }
}

// For running directly
if (require.main === module) {
  usersSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}
