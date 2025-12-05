import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  const email = 'fhossain@bigpond.net.au';
  
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { isGlobalAdmin: true },
    });
    
    console.log(`✅ Successfully made ${email} a global admin!`);
    console.log(`User: ${user.name} (${user.email})`);
    console.log(`isGlobalAdmin: ${user.isGlobalAdmin}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
