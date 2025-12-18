import { Request, Response, NextFunction } from 'express';
import { BrandService } from '../services/brand.service';

export class BrandController {
  private brandService: BrandService;

  constructor() {
    this.brandService = new BrandService();
  }

  getBrands = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, search, isActive } = req.query;
      
      const brands = await this.brandService.getBrands({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        isActive: isActive === 'true',
      });
      
      res.status(200).json({
        success: true,
        data: brands,
      });
    } catch (error) {
      next(error);
    }
  };

  getBrandById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brand = await this.brandService.getBrandById(req.params.id);
      res.status(200).json({
        success: true,
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  };

  createBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brand = await this.brandService.createBrand(req.body.body);
      res.status(201).json({
        success: true,
        data: brand,
        message: 'Brand created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brand = await this.brandService.updateBrand(req.params.id, req.body.body);
      res.status(200).json({
        success: true,
        data: brand,
        message: 'Brand updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.brandService.deleteBrand(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Brand deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
