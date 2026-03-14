const paymentService = require("./payment.service");
const { success, error } = require("../../utils/apiResponse");

const paymentController = {

  async createPaymentOrder(req, res) {
    const { orderId } = req.body;
    if (!orderId) return error(res, "orderId chahiye.", 400);
    const result = await paymentService.createPaymentOrder(orderId);
    success(res, result, "Payment order create ho gaya!");
  },

  async verifyPayment(req, res) {
    const result = await paymentService.verifyPayment(req.body);
    success(res, result, "Payment verified! Order confirmed.");
  },

  async webhook(req, res) {
    const signature = req.headers["x-razorpay-signature"];
    const result = await paymentService.handleWebhook(req.body, signature);
    success(res, result);
  },
};

module.exports = paymentController;