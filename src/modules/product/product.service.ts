import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { Category } from '../category/entities/category.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private async clearCacheProduct() {
    const cache = this.cacheManager as unknown as {
      reset?: () => Promise<void>;
      clear?: () => Promise<void>;
    };
    if (typeof cache.reset === 'function') {
      await cache.reset();
    } else if (typeof cache.clear === 'function') {
      await cache.clear();
    }
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create({
      ...createProductDto,
      category: { id: createProductDto.categoryId },
    });
    const savedProduct = await this.productRepository.save(product);
    await this.clearCacheProduct();
    return savedProduct;
  }

  async findAll(querydto: GetProductsQueryDto = {}) {
    const cacheKey = `products_list_${JSON.stringify(querydto)}`;

    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = querydto || {};

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (search) {
      query.andWhere('LOWER(product.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    if (categoryId) {
      query.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (minPrice !== undefined) {
      query.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      query.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    const upperOrder = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    query.orderBy(`product.${sortBy}`, upperOrder);

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();
    const pageCount = Math.ceil(total / limit);

    const result = {
      data,
      total,
      page,
      pageCount,
    };

    await this.cacheManager.set(cacheKey, result, 60000);

    return result;
  }
  async findOne(id: number): Promise<Product> {
    const cacheKey = `product_detail_${id}`;
    const cachedProduct = await this.cacheManager.get<Product>(cacheKey);
    if (cachedProduct) {
      return cachedProduct;
    }

    const product = await this.productRepository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`ID-si ${id} olan  məhsul tapılmalıdı`);
    }
    await this.cacheManager.set(cacheKey, product, 60000);
    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);
    if (updateProductDto.categoryId) {
      product.category = { id: updateProductDto.categoryId } as Category;
    }
    Object.assign(product, updateProductDto);
    const updatedProduct = await this.productRepository.save(product);
    await this.clearCacheProduct();
    return updatedProduct;
  }

  async remove(id: number): Promise<{ message: string }> {
    const product = await this.findOne(id);
    await this.productRepository.softRemove(product);
    await this.clearCacheProduct();
    return { message: 'Məhsul uğurla silindi (Soft Deleted).' };
  }
}
