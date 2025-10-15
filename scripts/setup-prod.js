import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function setupProduction() {
  try {
    console.log('🚀 Setting up production environment...');
    
    // Create admin user
    const adminPassword = await bcrypt.hash(process.env.ADMIN_INITIAL_PASSWORD || 'ChangeMe123!', 10);
    await prisma.user.upsert({
      where: { email: 'admin@fitland-shop.com' },
      update: {},
      create: {
        firstName: 'Admin',
        lastName: 'Fitland',
        email: 'admin@fitland-shop.com',
        password: adminPassword,
        role: 'ADMIN',
      },
    });

    // Create sample products
    const products = [
      {
        name: "Professional Treadmill X1000",
        brand: "FitPro",
        category: "Cardio",
        description: "Commercial treadmill with 5HP motor and 22-inch display",
        price: 2999.99,
        stock: 10,
        discountPercent: 15,
        imageUrl: "/images/treadmill-pro.jpg"
      },
      {
        name: "Adjustable Dumbbells 40kg",
        brand: "PowerGear",
        category: "Strength",
        description: "Quick-adjust dumbbell system 5-40kg per hand",
        price: 799.99,
        stock: 25,
        discountPercent: 10,
        imageUrl: "/images/dumbbells-pro.jpg"
      },
      {
        name: "Yoga Mat Premium",
        brand: "ZenFit",
        category: "Yoga",
        description: "Eco-friendly non-slip yoga mat with carrying strap",
        price: 49.99,
        stock: 100,
        discountPercent: 0,
        imageUrl: "/images/yoga-mat.jpg"
      }
    ];

    for (const product of products) {
      await prisma.product.upsert({
        where: { name: product.name },
        update: {},
        create: product
      });
    }

    console.log('✅ Production setup completed!');
    console.log('📧 Admin login: admin@fitland-shop.com');
    console.log('🔑 Change the default password immediately!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupProduction();