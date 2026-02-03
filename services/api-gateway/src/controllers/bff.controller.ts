import { Request, Response, NextFunction } from 'express';
import { BFFService } from '../services/bff.service';

export class BFFController {
  private bffService: BFFService;

  constructor() {
    this.bffService = new BFFService();
  }

  getHomePageData = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.bffService.getHomePageData();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  getProductDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.bffService.getProductDetails(req.params.id);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  getUserDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const data = await this.bffService.getUserDashboard(userId);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}
