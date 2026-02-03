"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const axios_1 = __importDefault(require("axios"));
const common_1 = require("@shopping-app/common");
const config_1 = require("@shopping-app/config");
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || config_1.SERVICE_URLS.PRODUCT;
class ProductService {
    async getProductsByIds(productIds) {
        try {
            const productPromises = productIds.map((id) => axios_1.default.get(`${PRODUCT_SERVICE_URL}/api/products/${id}`).then((res) => res.data.data));
            const products = await Promise.all(productPromises);
            return products;
        }
        catch (error) {
            common_1.logger.error('Failed to fetch products', { error, productIds });
            throw new common_1.BadRequestError('Failed to validate products');
        }
    }
}
exports.ProductService = ProductService;
//# sourceMappingURL=product.service.js.map