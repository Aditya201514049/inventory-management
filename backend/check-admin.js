const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking all users in database:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        blocked: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.name || 'No name'}) - Admin: ${user.isAdmin}, Blocked: ${user.blocked}`);
    });
    
    const adminCount = users.filter(u => u.isAdmin).length;
    console.log(`\nTotal admins: ${adminCount}`);
    
    if (adminCount === 0) {
      console.log('\n⚠️  NO ADMIN USERS FOUND! Creating admin user...');
      
      // Find the first user and make them admin
      if (users.length > 0) {
        const firstUser = users[0];
        await prisma.user.update({
          where: { id: firstUser.id },
          data: { isAdmin: true }
        });
        console.log(`✅ Made ${firstUser.email} an admin`);
      } else {
        console.log('❌ No users exist in database');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
