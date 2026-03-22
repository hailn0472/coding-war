import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('\n=== Checking Users in Database ===\n');
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      isEmailVerified: true,
      emailVerifyToken: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (users.length === 0) {
    console.log('No users found in database.');
  } else {
    console.log(`Found ${users.length} user(s):\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Email Verified: ${user.isEmailVerified}`);
      console.log(`   Verification Token: ${user.emailVerifyToken ? 'Present' : 'None'}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

checkUsers().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
