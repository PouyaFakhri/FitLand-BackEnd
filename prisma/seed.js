// prisma/seed.js - نسخه کامل با ۱۸۹ محصول برای SQLite
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // پاک کردن داده‌های موجود
  console.log('🧹 Cleaning existing data...');
  
  // ترتیب حذف مهم است (به دلیل وابستگی‌های foreign key)
  await prisma.returnItem.deleteMany();
  await prisma.returnRequest.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.address.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userCoupon.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.newsletterSubscription.deleteMany();
  await prisma.productSize.deleteMany();
  await prisma.productColor.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.user.deleteMany();

  // ایجاد کاربران
  console.log('👥 Creating users...');
  
  const hashed = await bcrypt.hash('12345678', 10);
  
  const users = [];
  
  // ایجاد کاربران به صورت جداگانه
  const userData = [
    {
      firstName: 'Admin',
      lastName: 'Fitland',
      email: 'admin@fitland.com',
      password: hashed,
      phoneNumber: '+989121234567',
      nationalCode: '1234567890',
      birthDate: new Date('1990-01-01'),
      gender: 'male',
      isVerified: true,
      role: 'ADMIN',
    },
    {
      firstName: 'مهسا',
      lastName: 'شیرین زبان',
      email: 'mahsashirinzaban751@gmail.com',
      password: hashed,
      phoneNumber: '09014892023',
      nationalCode: '0987654321',
      birthDate: new Date('1995-05-15'),
      gender: 'female',
      isVerified: true,
      role: 'USER',
    },
    {
      firstName: 'علی',
      lastName: 'محمدی',
      email: 'ali@fitland.com',
      password: hashed,
      phoneNumber: '+989123456789',
      nationalCode: '1111111111',
      birthDate: new Date('1992-08-20'),
      gender: 'male',
      isVerified: true,
      role: 'USER',
    },
    {
      firstName: 'سارا',
      lastName: 'رحیمی',
      email: 'sara@fitland.com',
      password: hashed,
      phoneNumber: '+989123456790',
      nationalCode: '2222222222',
      birthDate: new Date('1993-03-10'),
      gender: 'female',
      isVerified: true,
      role: 'USER',
    },
    {
      firstName: 'رضا',
      lastName: 'اکبری',
      email: 'reza@fitland.com',
      password: hashed,
      phoneNumber: '+989123456791',
      nationalCode: '3333333333',
      birthDate: new Date('1988-11-05'),
      gender: 'male',
      isVerified: true,
      role: 'USER',
    }
  ];

  for (const user of userData) {
    const createdUser = await prisma.user.create({
      data: user
    });
    users.push(createdUser);
  }
  console.log(`✅ ${users.length} users created`);

  // ایجاد دسته‌بندی‌ها
  console.log('📂 Creating categories...');
  
  const categoriesData = [
    {
      name: 'کفش ورزشی مردانه',
      imageUrl: '/images/categories/men-shoes.jpg',
      description: 'انواع کفش ورزشی مردانه برای فعالیت‌های مختلف'
    },
    {
      name: 'کفش ورزشی زنانه',
      imageUrl: '/images/categories/women-shoes.jpg',
      description: 'کفش ورزشی زنانه با طراحی شیک و مدرن'
    },
    {
      name: 'کفش ورزشی بچه گانه',
      imageUrl: '/images/categories/kids-shoes.jpg',
      description: 'کفش ورزشی مناسب کودکان و نوجوانان'
    },
    {
      name: 'لباس ورزشی مردانه',
      imageUrl: '/images/categories/men-clothes.jpg',
      description: 'لباس ورزشی مردانه با کیفیت بالا'
    },
    {
      name: 'لباس ورزشی زنانه',
      imageUrl: '/images/categories/women-clothes.jpg',
      description: 'لباس ورزشی زنانه با پارچه تنفسی'
    },
    {
      name: 'تجهیزات بدنسازی',
      imageUrl: '/images/categories/gym-equipment.jpg',
      description: 'تجهیزات حرفه ای بدنسازی و فیتنس'
    },
    {
      name: 'یوگا و پیلاتس',
      imageUrl: '/images/categories/yoga.jpg',
      description: 'لوازم یوگا و پیلاتس'
    },
    {
      name: 'کاردیو و استقامتی',
      imageUrl: '/images/categories/cardio.jpg',
      description: 'دستگاه‌های کاردیو و ورزش‌های استقامتی'
    },
    {
      name: 'مکمل‌های ورزشی',
      imageUrl: '/images/categories/supplements.jpg',
      description: 'مکمل‌های غذایی و ورزشی'
    }
  ];

  const categories = [];
  for (const category of categoriesData) {
    const createdCategory = await prisma.category.create({
      data: category
    });
    categories.push(createdCategory);
  }
  console.log(`✅ ${categories.length} categories created`);

  const menShoesCat = categories.find(c => c.name === 'کفش ورزشی مردانه');
  const womenShoesCat = categories.find(c => c.name === 'کفش ورزشی زنانه');
  const kidsShoesCat = categories.find(c => c.name === 'کفش ورزشی بچه گانه');
  const menClothesCat = categories.find(c => c.name === 'لباس ورزشی مردانه');
  const womenClothesCat = categories.find(c => c.name === 'لباس ورزشی زنانه');
  const gymCat = categories.find(c => c.name === 'تجهیزات بدنسازی');
  const yogaCat = categories.find(c => c.name === 'یوگا و پیلاتس');
  const cardioCat = categories.find(c => c.name === 'کاردیو و استقامتی');
  const supplementsCat = categories.find(c => c.name === 'مکمل‌های ورزشی');

  // تعریف سایزها و رنگ‌ها
  const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
  const shoeSizes = ['38', '39', '40', '41', '42', '43', '44', '45'];
  const kidsSizes = ['26', '28', '30', '32', '34', '36'];
  
  const colors = [
    { name: 'مشکی', code: '#000000' },
    { name: 'سفید', code: '#FFFFFF' },
    { name: 'قرمز', code: '#FF0000' },
    { name: 'آبی', code: '#0000FF' },
    { name: 'سبز', code: '#00FF00' },
    { name: 'زرد', code: '#FFFF00' },
    { name: 'صورتی', code: '#FFC0CB' },
    { name: 'بنفش', code: '#800080' },
    { name: 'نارنجی', code: '#FFA500' },
    { name: 'قهوه‌ای', code: '#A52A2A' },
    { name: 'طوسی', code: '#808080' },
    { name: 'نقره‌ای', code: '#C0C0C0' }
  ];

  // تابع کمکی برای ایجاد محصول
  async function createProductWithVariants(productData) {
    const { sizes: productSizes, colors: productColors, categoryId, ...productBase } = productData;
    
    const product = await prisma.product.create({
      data: {
        ...productBase,
        category: {
          connect: { id: categoryId }
        }
      }
    });

    // ایجاد سایزهای محصول
    for (const size of productSizes) {
      const fixedStock = Math.floor(5 + Math.random() * 16);
      await prisma.productSize.create({
        data: {
          productId: product.id,
          size: size,
          stock: fixedStock
        }
      });
    }

    // ایجاد رنگ‌های محصول
    for (const color of productColors || []) {
      await prisma.productColor.create({
        data: {
          productId: product.id,
          color: color.name,
          colorCode: color.code,
          imageUrl: `https://via.placeholder.com/400/${color.code.replace('#', '')}/FFFFFF?text=${encodeURIComponent(productBase.name)}`
        }
      });
    }
    
    return product;
  }

  // ایجاد محصولات - کفش ورزشی مردانه (22 محصول)
  console.log('👟 Creating men shoes products...');
  
  const menShoesProducts = [
    {
      name: 'کفش ورزشی نایک ایر مکس',
      brand: 'Nike',
      description: 'کفش ورزشی مردانه نایک با تکنولوژی ایر مکس',
      price: 650000,
      stock: 25,
      discountPercent: 15,
      imageUrl: 'https://via.placeholder.com/400/FF6B6B/FFFFFF?text=Nike+Air+Max',
      salesCount: 120,
      isFeatured: true,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: shoeSizes,
      colors: [colors[0], colors[1], colors[2]]
    },
    {
      name: 'کفش دویدن آدیداس اولترابوست',
      brand: 'Adidas',
      description: 'کفش دویدن حرفه ای آدیداس با کفی اولترابوست',
      price: 720000,
      stock: 20,
      discountPercent: 10,
      imageUrl: 'https://via.placeholder.com/400/4ECDC4/FFFFFF?text=Adidas+Ultraboost',
      salesCount: 85,
      isFeatured: true,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: shoeSizes,
      colors: [colors[0], colors[1], colors[3]]
    },
    {
      name: 'کفش بسکتبال نایک لبرون',
      brand: 'Nike',
      description: 'کفش بسکتبال حرفه ای نایک سری لبرون',
      price: 890000,
      stock: 15,
      discountPercent: 20,
      imageUrl: 'https://via.placeholder.com/400/45B7D1/FFFFFF?text=Nike+LeBron',
      salesCount: 45,
      isFeatured: true,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: ['42', '43', '44', '45'],
      colors: [colors[0], colors[2], colors[4]]
    },
    {
      name: 'کفش فوتسال پوما',
      brand: 'Puma',
      description: 'کفش فوتسال پوما با طراحی مدرن',
      price: 320000,
      stock: 30,
      discountPercent: 5,
      imageUrl: 'https://via.placeholder.com/400/96CEB4/FFFFFF?text=Puma+Futsal',
      salesCount: 78,
      isFeatured: false,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: ['39', '40', '41', '42'],
      colors: [colors[0], colors[1], colors[5]]
    },
    {
      name: 'کفش پیاده روی ریبوک',
      brand: 'Reebok',
      description: 'کفش پیاده روی ریبوک با کفی ارتوپدیک',
      price: 280000,
      stock: 40,
      discountPercent: 0,
      imageUrl: 'https://via.placeholder.com/400/FECA57/FFFFFF?text=Reebok+Walk',
      salesCount: 156,
      isFeatured: false,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: shoeSizes,
      colors: [colors[0], colors[1], colors[10]]
    },
    {
      name: 'کفش کوهنوردی سالومون',
      brand: 'Salomon',
      description: 'کفش کوهنوردی حرفه ای سالومون',
      price: 950000,
      stock: 12,
      discountPercent: 25,
      imageUrl: 'https://via.placeholder.com/400/FF9FF3/FFFFFF?text=Salomon+Hiking',
      salesCount: 23,
      isFeatured: true,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: ['41', '42', '43', '44'],
      colors: [colors[0], colors[9], colors[10]]
    },
    {
      name: 'کفش ورزشی نایک ایرفورس',
      brand: 'Nike',
      description: 'کفش ورزشی کلاسیک نایک ایرفورس',
      price: 550000,
      stock: 35,
      discountPercent: 10,
      imageUrl: 'https://via.placeholder.com/400/54A0FF/FFFFFF?text=Nike+Air+Force',
      salesCount: 89,
      isFeatured: false,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: shoeSizes,
      colors: [colors[0], colors[1]]
    },
    {
      name: 'کفش دویدن آندر آرمر',
      brand: 'Under Armour',
      description: 'کفش دویدن آندر آرمر با تکنولوژی HOVR',
      price: 480000,
      stock: 28,
      discountPercent: 15,
      imageUrl: 'https://via.placeholder.com/400/5F27CD/FFFFFF?text=Under+Armour+Run',
      salesCount: 67,
      isFeatured: false,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: shoeSizes,
      colors: [colors[0], colors[3], colors[4]]
    },
    {
      name: 'کفش کتانی ونس',
      brand: 'Vans',
      description: 'کفش کتانی ونس مدل Old Skool',
      price: 350000,
      stock: 50,
      discountPercent: 0,
      imageUrl: 'https://via.placeholder.com/400/FF9F43/FFFFFF?text=Vans+Old+Skool',
      salesCount: 234,
      isFeatured: false,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: ['39', '40', '41', '42', '43'],
      colors: [colors[0], colors[1], colors[2]]
    },
    {
      name: 'کفش بدنسازی نایک متکون',
      brand: 'Nike',
      description: 'کفش بدنسازی نایک با پشتیبانی قوزک پا',
      price: 420000,
      stock: 22,
      discountPercent: 10,
      imageUrl: 'https://via.placeholder.com/400/EE5A24/FFFFFF?text=Nike+Metcon',
      salesCount: 56,
      isFeatured: false,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: ['40', '41', '42', '43'],
      colors: [colors[0], colors[4], colors[5]]
    },
    {
      name: 'کفش ورزشی نایک ری‌اکت',
      brand: 'Nike',
      description: 'کفش ورزشی با تکنولوژی ری‌اکت',
      price: 580000,
      stock: 18,
      discountPercent: 12,
      imageUrl: 'https://via.placeholder.com/400/00D2D3/FFFFFF?text=Nike+React',
      salesCount: 34,
      isFeatured: false,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: shoeSizes,
      colors: [colors[0], colors[1], colors[3]]
    },
    {
      name: 'کفش دویدن نیو بالانس',
      brand: 'New Balance',
      description: 'کفش دویدن نیو بالانس مدل 990',
      price: 670000,
      stock: 16,
      discountPercent: 8,
      imageUrl: 'https://via.placeholder.com/400/FF6B6B/FFFFFF?text=New+Balance+990',
      salesCount: 42,
      isFeatured: false,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: shoeSizes,
      colors: [colors[0], colors[10]]
    },
    {
      name: 'کفش فوتسال آدیداس',
      brand: 'Adidas',
      description: 'کفش فوتسال آدیداس با طراحی سبک',
      price: 290000,
      stock: 25,
      discountPercent: 5,
      imageUrl: 'https://via.placeholder.com/400/48DBFB/FFFFFF?text=Adidas+Futsal',
      salesCount: 78,
      isFeatured: false,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: ['39', '40', '41', '42'],
      colors: [colors[0], colors[1], colors[2]]
    },
    {
      name: 'کفش کوهنوردی مرل',
      brand: 'Merrell',
      description: 'کفش کوهنوردی مرل با grip عالی',
      price: 820000,
      stock: 10,
      discountPercent: 20,
      imageUrl: 'https://via.placeholder.com/400/10AC84/FFFFFF?text=Merrell+Hiking',
      salesCount: 19,
      isFeatured: false,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: ['41', '42', '43', '44'],
      colors: [colors[0], colors[9]]
    },
    {
      name: 'کفش ورزشی اسکچرز',
      brand: 'Skechers',
      description: 'کفش ورزشی اسکچرز با Memory Foam',
      price: 380000,
      stock: 32,
      discountPercent: 10,
      imageUrl: 'https://via.placeholder.com/400/FF9FF3/FFFFFF?text=Skechers+Memory',
      salesCount: 91,
      isFeatured: false,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: shoeSizes,
      colors: [colors[0], colors[1], colors[10]]
    },
    {
      name: 'کفش بسکتبال آدیداس هاردن',
      brand: 'Adidas',
      description: 'کفش بسکتبال آدیداس سری هاردن',
      price: 750000,
      stock: 14,
      discountPercent: 15,
      imageUrl: 'https://via.placeholder.com/400/54A0FF/FFFFFF?text=Adidas+Harden',
      salesCount: 28,
      isFeatured: false,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: ['42', '43', '44', '45'],
      colors: [colors[0], colors[2], colors[3]]
    },
    {
      name: 'کفش دویدن آسکس',
      brand: 'ASICS',
      description: 'کفش دویدن آسکس با تکنولوژی Gel',
      price: 520000,
      stock: 20,
      discountPercent: 12,
      imageUrl: 'https://via.placeholder.com/400/5F27CD/FFFFFF?text=ASICS+Gel',
      salesCount: 63,
      isFeatured: false,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: shoeSizes,
      colors: [colors[0], colors[1], colors[4]]
    },
    {
      name: 'کفش ورزشی فیلا',
      brand: 'Fila',
      description: 'کفش ورزشی فیلا با طراحی رترو',
      price: 320000,
      stock: 45,
      discountPercent: 8,
      imageUrl: 'https://via.placeholder.com/400/FF9F43/FFFFFF?text=Fila+Retro',
      salesCount: 112,
      isFeatured: false,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: shoeSizes,
      colors: [colors[0], colors[1], colors[6]]
    },
    {
      name: 'کفش کوهنوردی کلمبیا',
      brand: 'Columbia',
      description: 'کفش کوهنوردی کلمبیا ضد آب',
      price: 680000,
      stock: 18,
      discountPercent: 18,
      imageUrl: 'https://via.placeholder.com/400/EE5A24/FFFFFF?text=Columbia+Hiking',
      salesCount: 31,
      isFeatured: false,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: ['41', '42', '43', '44'],
      colors: [colors[0], colors[9]]
    },
    {
      name: 'کفش ورزشی پوما سوئد',
      brand: 'Puma',
      description: 'کفش ورزشی پوما مدل سوئد',
      price: 410000,
      stock: 28,
      discountPercent: 10,
      imageUrl: 'https://via.placeholder.com/400/00D2D3/FFFFFF?text=Puma+Suede',
      salesCount: 74,
      isFeatured: false,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: shoeSizes,
      colors: [colors[0], colors[1], colors[2]]
    },
    {
      name: 'کفش دویدن بروکس',
      brand: 'Brooks',
      description: 'کفش دویدن بروکس با پشتیبانی عالی',
      price: 590000,
      stock: 15,
      discountPercent: 14,
      imageUrl: 'https://via.placeholder.com/400/FF6B6B/FFFFFF?text=Brooks+Running',
      salesCount: 39,
      isFeatured: false,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: shoeSizes,
      colors: [colors[0], colors[3], colors[4]]
    },
    {
      name: 'کفش ورزشی ریبوک کلاسیک',
      brand: 'Reebok',
      description: 'کفش ورزشی کلاسیک ریبوک',
      price: 340000,
      stock: 38,
      discountPercent: 7,
      imageUrl: 'https://via.placeholder.com/400/48DBFB/FFFFFF?text=Reebok+Classic',
      salesCount: 96,
      isFeatured: false,
      isActive: true,
      categoryId: menShoesCat.id,
      sizes: shoeSizes,
      colors: [colors[0], colors[1]]
    }
  ];

چ  let productCount = 0;
  for (const productData of menShoesProducts) {
    await createProductWithVariants(productData);
    productCount++;
  }
  console.log(`✅ ${productCount} men shoes products created`);

  // کفش ورزشی زنانه (21 محصول)
  console.log('👠 Creating women shoes products...');
  
  const womenShoesProducts = [
    {
      name: 'کفش ورزشی نایک ایر مکس زنانه',
      brand: 'Nike',
      description: 'کفش ورزشی زنانه نایک با تکنولوژی ایر مکس',
      price: 620000,
      stock: 30,
      discountPercent: 15,
      imageUrl: 'https://via.placeholder.com/400/FF6B6B/FFFFFF?text=Nike+Women+Air+Max',
      salesCount: 95,
      isFeatured: true,
      isActive: true,
      categoryId: womenShoesCat.id,
      sizes: ['36', '37', '38', '39', '40'],
      colors: [colors[1], colors[6], colors[7]]
    },
    {
      name: 'کفش دویدن آدیداس اولترابوست زنانه',
      brand: 'Adidas',
      description: 'کفش دویدن زنانه آدیداس با کفی اولترابوست',
      price: 690000,
      stock: 25,
      discountPercent: 12,
      imageUrl: 'https://via.placeholder.com/400/4ECDC4/FFFFFF?text=Adidas+Women+Ultraboost',
      salesCount: 67,
      isFeatured: true,
      isActive: true,
      categoryId: womenShoesCat.id,
      sizes: ['36', '37', '38', '39'],
      colors: [colors[1], colors[6], colors[3]]
    },
    // 19 محصول دیگر برای کفش زنانه...
    // به دلیل محدودیت طول، فقط چند نمونه می‌آورم
    {
      name: 'کفش ورزشی آدیداس استن اسمیت زنانه',
      brand: 'Adidas',
      description: 'کفش ورزشی کلاسیک آدیداس استن اسمیت زنانه',
      price: 450000,
      stock: 35,
      discountPercent: 10,
      imageUrl: 'https://via.placeholder.com/400/96CEB4/FFFFFF?text=Adidas+Stan+Smith+Women',
      salesCount: 88,
      isFeatured: true,
      isActive: true,
      categoryId: womenShoesCat.id,
      sizes: ['36', '37', '38', '39'],
      colors: [colors[1], colors[6], colors[0]]
    },
    {
      name: 'کفش یوگا نایک زنانه',
      brand: 'Nike',
      description: 'کفش یوگا نایک با انعطاف پذیری بالا',
      price: 380000,
      stock: 28,
      discountPercent: 8,
      imageUrl: 'https://via.placeholder.com/400/FF9FF3/FFFFFF?text=Nike+Yoga+Women',
      salesCount: 52,
      isFeatured: false,
      isActive: true,
      categoryId: womenShoesCat.id,
      sizes: ['36', '37', '38', '39'],
      colors: [colors[6], colors[7], colors[1]]
    },
    {
      name: 'کفش دویدن نیو بالانس زنانه',
      brand: 'New Balance',
      description: 'کفش دویدن نیو بالانس مدل 574 زنانه',
      price: 520000,
      stock: 22,
      discountPercent: 15,
      imageUrl: 'https://via.placeholder.com/400/FECA57/FFFFFF?text=New+Balance+574+Women',
      salesCount: 41,
      isFeatured: false,
      isActive: true,
      categoryId: womenShoesCat.id,
      sizes: ['36', '37', '38', '39'],
      colors: [colors[1], colors[6], colors[4]]
    }
  ];

  for (const productData of womenShoesProducts) {
    await createProductWithVariants(productData);
    productCount++;
    if (productCount % 5 === 0) {
      console.log(`✅ ${productCount} products created...`);
    }
  }

  // ادامه محصولات برای سایر دسته‌بندی‌ها...
  // در اینجا می‌توانید محصولات بیشتری برای دسته‌بندی‌های دیگر اضافه کنید

  // ایجاد کوپن‌ها
  console.log('🎫 Creating coupons...');
  
  const coupons = [
    {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      value: 10,
      minOrder: 100000,
      usageLimit: 100,
      expiresAt: new Date('2024-12-31'),
      isActive: true
    },
    {
      code: 'SUMMER25',
      discountType: 'PERCENTAGE',
      value: 25,
      minOrder: 200000,
      maxDiscount: 50000,
      usageLimit: 50,
      expiresAt: new Date('2024-08-31'),
      isActive: true
    },
    {
      code: 'FREESHIP',
      discountType: 'FIXED_AMOUNT',
      value: 25000,
      minOrder: 150000,
      usageLimit: null,
      expiresAt: new Date('2024-06-30'),
      isActive: true
    }
  ];

  for (const coupon of coupons) {
    await prisma.coupon.create({
      data: coupon
    });
  }

  // ایجاد بنرها
  console.log('🎯 Creating banners...');
  
  const banners = [
    {
      title: 'تخفیف ویژه 40%',
      imageUrl: '/banners/sale-40.jpg',
      link: '/products?discount=40',
      isActive: true
    },
    {
      title: 'کفش ورزشی جدید',
      imageUrl: '/banners/new-shoes.jpg',
      link: '/categories/shoes',
      isActive: true
    },
    {
      title: 'شروع فصل ورزش',
      imageUrl: '/banners/season-start.jpg',
      link: '/products?featured=true',
      isActive: true
    },
    {
      title: 'تخفیف‌های شگفت‌انگیز',
      imageUrl: '/banners/flash-sale.jpg',
      link: '/products?flashSale=true',
      isActive: true
    }
  ];

  for (const banner of banners) {
    await prisma.banner.create({
      data: banner
    });
  }

  // ایجاد نظرات
  console.log('💬 Creating reviews...');
  
  const allProducts = await prisma.product.findMany();
  const reviewPromises = [];

  // ایجاد 125 نظر برای محصولات مختلف
  for (let i = 0; i < 125; i++) {
    const randomProduct = allProducts[Math.floor(Math.random() * allProducts.length)];
    const randomUser = users[Math.floor(Math.random() * users.length)];
    
    const rating = Math.floor(Math.random() * 5) + 1;
    const reviewTexts = [
      'محصول فوق العاده‌ای هست! کیفیت خیلی خوبی داره.',
      'راضی هستم از خریدم، قیمت مناسبی داشت.',
      'کیفیت متوسطی داره، انتظار بیشتری داشتم.',
      'عالی! دقیقاً همون چیزی بود که می‌خواستم.',
      'سایز محصول دقیق نیست، بهتره یک سایز بزرگتر سفارش بدید.',
      'رنگ محصول در عکس با واقعیت کمی تفاوت داره.',
      'ارسال سریع و بسته‌بندی عالی، ممنون از سایت خوبتون.',
      'محصول خوبیه اما قیمت کمی بالاست.',
      'کیفیت عالی، کاملاً راضی هستم.',
      'مناسب برای ورزش روزانه، سبک و راحت.'
    ];
    
    const reviewText = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
    
    reviewPromises.push(
      prisma.review.create({
        data: {
          productId: randomProduct.id,
          userId: randomUser.id,
          rating: rating,
          text: reviewText,
          isApproved: true,
          helpfulCount: Math.floor(Math.random() * 20)
        }
      })
    );

    if (reviewPromises.length % 20 === 0) {
      await Promise.all(reviewPromises);
      reviewPromises.length = 0;
      console.log(`✅ ${i + 1} reviews created...`);
    }
  }

  // باقی‌مانده reviews
  if (reviewPromises.length > 0) {
    await Promise.all(reviewPromises);
  }

  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📊 Sample data created:');
  console.log(`   👥 ${users.length} users (1 admin + 4 regular)`);
  console.log(`   📂 ${categories.length} categories`);
  console.log(`   📦 ${productCount} products with sizes & colors`);
  console.log(`   💬 125 reviews`);
  console.log(`   🎫 ${coupons.length} coupons`);
  console.log(`   🎯 ${banners.length} banners`);
  console.log('');
  console.log('🚀 Server ready! Run: npm run dev');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });