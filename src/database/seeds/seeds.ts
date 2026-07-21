import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Category } from '../../modules/category/entities/category.entity';
import { Product } from '../../modules/product/entities/product.entity';

async function runSeed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const categoryRepo = dataSource.getRepository(Category);
  const productRepo = dataSource.getRepository(Product);

  console.log('Seeding başladı...');

  const parentCategories: Category[] = [];
  for (let i = 0; i < 5; i++) {
    const parent = categoryRepo.create({
      name: faker.commerce.department() + ` (${i + 1})`,
    });
    parentCategories.push(await categoryRepo.save(parent));
  }

  const childCategories: Category[] = [];
  for (const parent of parentCategories) {
    for (let j = 0; j < 3; j++) {
      const child = categoryRepo.create({
        name: faker.commerce.productAdjective() + ' ' + parent.name,
        parent: parent,
      });
      childCategories.push(await categoryRepo.save(child));
    }
  }

  const allCategories = [...parentCategories, ...childCategories];

  console.log('1000+ Məhsul bazaya doldurulur...');
  const products: Product[] = [];

  for (let i = 0; i < 1050; i++) {
    const randomCategory =
      allCategories[Math.floor(Math.random() * allCategories.length)];

    const product = productRepo.create({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 10, max: 2000 })),
      stock: faker.number.int({ min: 0, max: 200 }),
      category: randomCategory,
    });

    products.push(product);
  }
  const chunkSize = 100;
  for (let i = 0; i < products.length; i += chunkSize) {
    const chunk = products.slice(i, i + chunkSize);
    await productRepo.save(chunk);
  }

  console.log('✅ Uğurla 1050 məhsul və kateqoriyalar əlavə olundu!');
  await app.close();
}

runSeed().catch((error) => {
  console.error('❌ Seeding xətası:', error);
  process.exit(1);
});
