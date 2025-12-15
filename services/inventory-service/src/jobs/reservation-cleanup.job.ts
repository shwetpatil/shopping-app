import { logger } from '@shopping-app/common';
import { InventoryService } from '../services/inventory.service';

export class ReservationCleanupJob {
  private inventoryService: InventoryService;
  private intervalId?: NodeJS.Timeout;
  private readonly INTERVAL = 60000; // Run every minute

  constructor() {
    this.inventoryService = new InventoryService();
  }

  start() {
    this.intervalId = setInterval(async () => {
      try {
        const count = await this.inventoryService.cleanupExpiredReservations();
        if (count > 0) {
          logger.info('Cleaned up expired reservations', { count });
        }
      } catch (error) {
        logger.error('Error in reservation cleanup job', error);
      }
    }, this.INTERVAL);

    logger.info('Reservation cleanup job started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      logger.info('Reservation cleanup job stopped');
    }
  }
}
