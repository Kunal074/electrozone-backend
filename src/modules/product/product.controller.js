const productService = require("./product.service");
const { success, error, paginated } = require("../../utils/apiResponse");

const productController = {

  async getProducts(req, res) {
    const result = await productService.getProducts(req.query);
    paginated(res, result.products, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  },

  async getProductById(req, res) {
    const product = await productService.getProductById(req.params.id);
    success(res, product);
  },

  async compareByModel(req, res) {
    const products = await productService.compareByModel(req.params.modelName);
    success(res, products, `${products.length} stores mein mila`);
  },

  async createProduct(req, res) {
    const product = await productService.createProduct(req.body, req.user);
    success(res, product, "Product add ho gaya!", 201);
  },

  async updateProduct(req, res) {
    const product = await productService.updateProduct(req.params.id, req.body, req.user);
    success(res, product, "Product update ho gaya!");
  },

  async deleteProduct(req, res) {
    const result = await productService.deleteProduct(req.params.id, req.user);
    success(res, result);
  },

  async updateStock(req, res) {
    const { stock } = req.body;
    const product = await productService.updateStock(req.params.id, stock, req.user);
    success(res, product, "Stock update ho gaya!");
  },

  async toggleFeatured(req, res) {
    const { isFeatured, expiryDays } = req.body;
    const product = await productService.toggleFeatured(req.params.id, isFeatured, expiryDays);
    success(res, product, `Featured ${isFeatured ? "on" : "off"} ho gaya!`);
  },
};

module.exports = productController;