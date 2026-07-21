import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(createCategoryDto);

    if (createCategoryDto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parentId },
        relations: { parent: true },
      });

      if (!parent) {
        throw new NotFoundException(
          'Seçilən valideyn (parent) kateqoriya tapılmadı.',
        );
      }

      if (parent.parent) {
        throw new BadRequestException(
          'Maksimum 1 mərhələ dərinliyə icazə verilir. Seçilən parent özü alt kateqoriyadır!',
        );
      }

      category.parent = parent;
    }

    return this.categoryRepository.save(category);
  }
  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { parent: IsNull() },
      relations: { children: true },
    });
  }

  // 3. READ (SINGLE)
  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: { parent: true, children: true },
    });

    if (!category) {
      throw new NotFoundException(`ID-si ${id} olan kateqoriya tapılmadı.`);
    }

    return category;
  }
  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.parentId) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException(
          'Kateqoriya özü-özünün valideyni ola bilməz!',
        );
      }

      const parent = await this.categoryRepository.findOne({
        where: { id: updateCategoryDto.parentId },
        relations: { parent: true },
      });

      if (!parent) {
        throw new NotFoundException(
          'Seçilən valideyn (parent) kateqoriya tapılmadı.',
        );
      }

      if (parent.parent) {
        throw new BadRequestException(
          'Maksimum 1 dərinliyə icazə verilir! Alt kateqoriyanın alt kateqoriyası ola bilməz.',
        );
      }

      category.parent = parent;
    }

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }
  async remove(id: number): Promise<{ message: string }> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
    return { message: 'Kateqoriya Uğurla Silindi' };
  }
}
