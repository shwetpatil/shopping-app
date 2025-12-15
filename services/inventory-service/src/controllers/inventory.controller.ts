import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  getAllInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 20, lowStock } = req.query;

      const result = await this.inventoryService.getAllInventory(
        parseInt(page as string),
        parseInt(limit as string),
        lowStock === 'true'
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getInventoryByProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productId } = req.params;
      const inventory = await this.inventoryService.getInventoryByProduct(productId);

      res.status(200).json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      next(error);
    }
  };

  createInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body.body;
      const inventory = await this.inventoryService.createInventory(data);

      res.status(201).json({
        success: true,
        data: inventory,
        message: 'Inventory created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { inventoryId } = req.params;
      const data = req.body.body;

      const inventory = await this.inventoryService.updateInventory(inventoryId, data);

      res.status(200).json({
        success: true,
        data: inventory,
        message: 'Inventory updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  adjustStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { inventoryId } = req.params;
      const { quantity, type, reference, notes } = req.body.body;

      const inventory = await this.inventoryService.adjustStock(
        inventoryId,
        quantity,
        type,
        reference,
        notes
      );

      res.status(200).json({
        success: true,
        data: inventory,
        message: 'Stock adjusted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { inventoryId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const result = await this.inventoryService.getTransactions(
        inventoryId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };
}
