const orderService = require("./order.service");
const { success, paginated } = require("../../utils/apiResponse");

const orderController = {

  async createOrder(req, res) {
    const order = await orderService.createOrder(req.body, req.user);
    success(res, order, "Order place ho gaya!", 201);
  },

  async getOrderById(req, res) {
    const order = await orderService.getOrderById(req.params.id, req.user);
    success(res, order);
  },

  async getMyOrders(req, res) {
    const result = await orderService.getMyOrders(req.user.id, req.query);
    paginated(res, result.orders, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  },

  async getStoreOrders(req, res) {
    const storeId = req.user.role === "SUPER_ADMIN"
      ? req.query.storeId
      : req.user.store.id;
    const result = await orderService.getStoreOrders(storeId, req.query);
    paginated(res, result.orders, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  },

  async updateOrderStatus(req, res) {
    const order = await orderService.updateOrderStatus(req.params.id, req.body.status, req.user);
    success(res, order, "Order status update ho gaya!");
  },

  async cancelOrder(req, res) {
    const result = await orderService.cancelOrder(req.params.id, req.user);
    success(res, result);
  },

  async verifyDelivery(req, res) {
    const order = await orderService.verifyDelivery(req.params.id, req.body.otp);
    success(res, order, "Delivery confirmed!");
  },
};

module.exports = orderController;