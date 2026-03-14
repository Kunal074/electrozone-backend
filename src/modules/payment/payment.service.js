const crypto = require("crypto");
const razorpay = require("../../config/razorpay");
const { prisma } = require("../../config/db");

const paymentService = {

  // ── Create Razorpay Order ──
  async createPaymentOrder(orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw { statusCode: 404, message: "Order nahi mila." };
    if (order.paymentStatus === "PAID") {
      throw { statusCode: 400, message: "Yeh order already paid hai." };
    }

    // COD mein sirf advance amount
    const amount = order.paymentMethod === "COD"
      ? await getCODAdvance(order.storeId)
      : order.totalAmount;

    const razorpayOrder = await razorpay.orders.create({
      amount:   Math.round(amount * 100), // Paise mein
      currency: "INR",
      receipt:  `receipt_${orderId}`,
      notes: {
        orderId,
        storeId: order.storeId,
      },
    });

    // Razorpay order ID save karo
    await prisma.order.update({
      where: { id: orderId },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount:          razorpayOrder.amount,
      currency:        razorpayOrder.currency,
      keyId:           process.env.RAZORPAY_KEY_ID,
    };
  },

  // ── Verify Payment ──
  async verifyPayment(data) {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId,
    } = data;

    // Signature verify karo
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      throw { statusCode: 400, message: "Payment verification failed. Invalid signature." };
    }

    // Order update karo
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        razorpayPaymentId,
        paymentStatus: "PAID",
        status:        "CONFIRMED",
      },
    });

    return order;
  },

  // ── Webhook (Razorpay automatic calls) ──
  async handleWebhook(body, signature) {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(JSON.stringify(body))
      .digest("hex");

    if (expectedSignature !== signature) {
      throw { statusCode: 400, message: "Invalid webhook signature." };
    }

    const event = body.event;
    const payment = body.payload?.payment?.entity;

    if (event === "payment.failed") {
      const orderId = payment?.notes?.orderId;
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "PENDING", status: "PENDING" },
        });
      }
    }

    return { received: true };
  },
};

// COD advance amount store se lao
const getCODAdvance = async (storeId) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { codAdvanceAmount: true },
  });
  return store?.codAdvanceAmount || 200;
};

module.exports = paymentService;