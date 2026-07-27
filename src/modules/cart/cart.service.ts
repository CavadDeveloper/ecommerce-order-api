import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../product/entities/product.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getOrCreateCart(userId: number): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: {
        items: {
          product: true,
        },
      },
    });

    if (!cart) {
      cart = this.cartRepository.create({
        user: { id: userId },
        items: [],
      });
      await this.cartRepository.save(cart);
    }

    return cart;
  }

  async getCart(userId: number) {
    const cart = await this.getOrCreateCart(userId);
    let cartTotal = 0;
    const formattedItems = cart.items.map((item) => {
      const subtotal = Number(item.product.price) * item.quantity;
      cartTotal += subtotal;
      return {
        id: item.id,
        quantity: item.quantity,
        subtotal: Number(subtotal.toFixed(2)),
        product: {
          id: item.product.id,
          name: item.product.name,
          price: Number(item.product.price),
          stock: item.product.stock,
        },
      };
    });

    return {
      id: cart.id,
      items: formattedItems,
      cartTotal: Number(cartTotal.toFixed(2)),
    };
  }

  async addToCart(userId: number, addToCartDto: AddToCartDto) {
    const { productId, quantity } = addToCartDto;
    const numericProductId = Number(productId);

    const product = await this.productRepository.findOne({
      where: { id: numericProductId },
    });

    if (!product) {
      throw new NotFoundException('Məhsul Tapılmadı');
    }

    const cart = await this.getOrCreateCart(userId);

    const cartItem = cart.items.find(
      (item) => item.product.id === numericProductId,
    );

    const targetQuantity = cartItem ? cartItem.quantity + quantity : quantity;

    if (targetQuantity > product.stock) {
      throw new BadRequestException(
        `Kifayət qədər stok yoxdur. Mövcud stok: ${product.stock}`,
      );
    }
    if (cartItem) {
      cartItem.quantity = targetQuantity;
      await this.cartItemRepository.save(cartItem);
    } else {
      const newCartItem = this.cartItemRepository.create({
        cart,
        product,
        quantity,
      });
      await this.cartItemRepository.save(newCartItem);
    }
    return this.getCart(userId);
  }

  async updateCartItem(
    userId: number,
    itemId: number,
    updateCartItemDto: UpdateCartDto,
  ) {
    const cart = await this.getOrCreateCart(userId);
    const cartItem = cart.items.find((item) => item.id === Number(itemId));

    if (!cartItem) {
      throw new NotFoundException('Səbətdə bu məhsul tapılmadı.');
    }

    if (updateCartItemDto.quantity < 1) {
      throw new BadRequestException('Miqdar minimum 1 olmalıdır.');
    }

    if (updateCartItemDto.quantity > cartItem.product.stock) {
      throw new BadRequestException(
        `Kifayət qədər stok yoxdur. Mövcud stok: ${cartItem.product.stock}`,
      );
    }

    cartItem.quantity = updateCartItemDto.quantity;
    await this.cartItemRepository.save(cartItem);

    return this.getCart(userId);
  }

  async removeCartItem(userId: number, itemId: number) {
    const cart = await this.getOrCreateCart(userId);
    const cartItem = cart.items.find((item) => item.id === Number(itemId));

    if (!cartItem) {
      throw new NotFoundException('Səbətdə bu məhsul tapılmadı.');
    }

    await this.cartItemRepository.remove(cartItem);
    return this.getCart(userId);
  }
}
