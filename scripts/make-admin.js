// Script to make first user a global admin
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get first user
  const firstUser = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' }
  });

  if (!firstUser) {
    console.log('No users found');
    return;
  }

  // Update to global admin and approved
  const updated = await prisma.user.update({
    where: { id: firstUser.id },
    data: {
      status: 'APPROVED',
      isGlobalAdmin: true,
      role: 'OWNER'
    }
  });

  console.log('Updated user to global admin:');
  console.log(`  Email: ${updated.email}`);
  console.log(`  Status: ${updated.status}`);
  console.log(`  Role: ${updated.role}`);
  console.log(`  Global Admin: ${updated.isGlobalAdmin}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
