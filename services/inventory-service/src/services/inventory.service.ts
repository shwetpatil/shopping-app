import { BadRequestError, NotFoundError, logger } from '@shopping-app/common';
import { InventoryRepository } from '../repositories/inventory.repository';
import { EventPublisher } from './event-publisher.service';
import { CreateInventoryDto, UpdateInventoryDto } from '../domain/inventory';

export class InventoryService {
  private inventoryRepository: InventoryRepository;
  private eventPublisher: EventPublisher;
  private readonly RESERVATION_TIMEOUT = parseInt(process.env.RESERVATION_TIMEOUT || '900'); // 15 minutes

  constructor() {
    this.inventoryRepository = new InventoryRepository();
    this.eventPublisher = new EventPublisher();
  }

  async getAllInventory(page: number, limit: number, lowStock?: boolean) {
    const skip = (page - 1) * limit;
    const { data, total } = await this.inventoryRepository.findAll(skip, limit, lowStock);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInventoryByProduct(productId: string) {
    const inventory = await this.inventoryRepository.findByProductId(productId);

    if (!inventory) {
      throw new NotFoundError('Inventory not found for this product');
    }

    return inventory;
  }

  async createInventory(data: CreateInventoryDto) {
    const existingInventory = await this.inventoryRepository.findByProductId(data.productId);

    if (existingInventory) {
      throw new BadRequestError('Inventory already exists for this product');
    }

    const inventory = await this.inventoryRepository.create(data);

    logger.info('Inventory created', { inventoryId: inventory.id, productId: data.productId });

    return inventory;
  }

  async updateInventory(inventoryId: string, data: UpdateInventoryDto) {
    const inventory = await this.inventoryRepository.findById(inventoryId);

    if (!inventory) {
      throw new NotFoundError('Inventory not found');
    }

    const updated = await this.inventoryRepository.update(inventoryId, data);

    logger.info('Inventory updated', { inventoryId });

    return updated;
  }

  async adjustStock(
    inventoryId: string,
    quantity: number,
    type: string,
    reference?: string,
    notes?: string
  ) {
    const inventory = await this.inventoryRepository.findById(inventoryId);

    if (!inventory) {
      throw new NotFoundError('Inventory not found');
    }

    const newQuantity = inventory.availableQuantity + quantity;

    if (newQuantity < 0) {
      throw new BadRequestError('Insufficient stock available');
    }

    const updated = await this.inventoryRepository.adjustStock(
      inventoryId,
      quantity,
      type,
      reference,
      notes
    );

    // Check for low stock
    if (updated.availableQuantity <= updated.reorderLevel) {
      await this.eventPublisher.publishLowStock(updated);
    }

    logger.info('Stock adjusted', { inventoryId, quantity, type });

    return updated;
  }

  async reserveStock(productId: string, orderId: string, userId: string, quantity: number) {
    const inventory = await this.inventoryRepository.findByProductId(productId);

    if (!inventory) {
      throw new NotFoundError('Inventory not found');
    }

    if (inventory.availableQuantity < quantity) {
      throw new BadRequestError('Insufficient stock available');
    }

    const expiresAt = new Date(Date.now() + this.RESERVATION_TIMEOUT * 1000);

    const reservation = await this.inventoryRepository.createReservation({
      inventoryId: inventory.id,
      orderId,
      userId,
      quantity,
      expiresAt,
    });

    await this.inventoryRepository.updateQuantities(inventory.id, {
      availableQuantity: inventory.availableQuantity - quantity,
      reservedQuantity: inventory.reservedQuantity + quantity,
    });

    await this.eventPublisher.publishInventoryReserved({
      orderId,
      productId,
      quantity,
      reservationId: reservation.id,
    });

    logger.info('Stock reserved', { inventoryId: inventory.id, orderId, quantity });

    return reservation;
  }

  async confirmReservation(orderId: string) {
    const reservation = await this.inventoryRepository.findReservationByOrder(orderId);

    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }

    if (reservation.status !== 'ACTIVE') {
      throw new BadRequestError('Reservation is not active');
    }

    const inventory = await this.inventoryRepository.findById(reservation.inventoryId);

    if (!inventory) {
      throw new NotFoundError('Inventory not found');
    }

    await this.inventoryRepository.completeReservation(reservation.id);

    await this.inventoryRepository.updateQuantities(inventory.id, {
      reservedQuantity: inventory.reservedQuantity - reservation.quantity,
      totalQuantity: inventory.totalQuantity - reservation.quantity,
    });

    logger.info('Reservation confirmed', { orderId, reservationId: reservation.id });
  }

  async cancelReservation(orderId: string) {
    const reservation = await this.inventoryRepository.findReservationByOrder(orderId);

    if (!reservation) {
      logger.warn('Reservation not found for cancellation', { orderId });
      return;
    }

    if (reservation.status !== 'ACTIVE') {
      return;
    }

    const inventory = await this.inventoryRepository.findById(reservation.inventoryId);

    if (!inventory) {
      throw new NotFoundError('Inventory not found');
    }

    await this.inventoryRepository.cancelReservation(reservation.id);

    await this.inventoryRepository.updateQuantities(inventory.id, {
      availableQuantity: inventory.availableQuantity + reservation.quantity,
      reservedQuantity: inventory.reservedQuantity - reservation.quantity,
    });

    await this.eventPublisher.publishInventoryReleased({
      orderId,
      productId: inventory.productId,
      quantity: reservation.quantity,
    });

    logger.info('Reservation cancelled', { orderId, reservationId: reservation.id });
  }

  async cleanupExpiredReservations() {
    const expiredReservations = await this.inventoryRepository.findExpiredReservations();

    for (const reservation of expiredReservations) {
      try {
        await this.cancelReservation(reservation.orderId);
        logger.info('Expired reservation cleaned up', { orderId: reservation.orderId });
      } catch (error) {
        logger.error('Failed to cleanup reservation', { orderId: reservation.orderId, error });
      }
    }

    return expiredReservations.length;
  }

  async getTransactions(inventoryId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const { data, total } = await this.inventoryRepository.findTransactions(inventoryId, skip, limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
