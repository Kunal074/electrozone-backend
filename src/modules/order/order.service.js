// src/modules/order/order.service.js
const { prisma } = require("../../config/db");

const orderService = {

  // ── Create Order ──
  async createOrder(data, user) {
    const {
      storeId, items, fulfillmentType,
      deliveryAddress, paymentMethod,
      guestName, guestPhone, notes,
    } = data;

    // Store check
    const store = await prisma.store.findUnique({ where: { id: storeId, isApproved: true } });
    if (!store) throw { statusCode: 404, message: "Store nahi mila." };

    // COD check
    if (paymentMethod === "COD" && !store.isCODAvailable) {
      throw { statusCode: 400, message: "Yeh store COD accept nahi karta." };
    }

    // Items validate + price calculate
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      if (item.productId) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId, isActive: true, storeId },
        });
        if (!product) throw { statusCode: 404, message: `Product nahi mila: ${item.productId}` };

        // Offline model mein stock check
        if (product.modelType === "OFFLINE" && product.stock < item.quantity) {
          throw { statusCode: 400, message: `${product.modelName} ka stock available nahi hai.` };
        }

        subtotal += product.price * item.quantity;
        orderItems.push({ productId: item.productId, quantity: item.quantity, priceAtTime: product.price });
      }

      if (item.usedPhoneId) {
        const usedPhone = await prisma.usedPhone.findUnique({
          where: { id: item.usedPhoneId, isAvailable: true, storeId },
        });
        if (!usedPhone) throw { statusCode: 404, message: "Used phone available nahi hai." };

        subtotal += usedPhone.askingPrice;
        orderItems.push({ usedPhoneId: item.usedPhoneId, quantity: 1, priceAtTime: usedPhone.askingPrice });
      }
    }

    const deliveryCharge = fulfillmentType === "HOME_DELIVERY" ? store.deliveryCharge : 0;
    const totalAmount = subtotal + deliveryCharge;

    // OTP for delivery
    const deliveryOTP = Math.floor(1000 + Math.random() * 9000).toString();

    // Transaction — order create + stock update
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          storeId,
          customerId:      user?.id || null,
          guestName:       user ? null : guestName,
          guestPhone:      user ? null : guestPhone,
          fulfillmentType: fulfillmentType.toUpperCase(),
          deliveryAddress: fulfillmentType === "HOME_DELIVERY" ? deliveryAddress : null,
          paymentMethod:   paymentMethod.toUpperCase(),
          paymentStatus:   paymentMethod === "COD" ? "PENDING" : "PENDING",
          subtotal,
          deliveryCharge,
          totalAmount,
          deliveryOTP,
          notes,
          items: {
            create: orderItems,
          },
        },
        include: { items: true },
      });

      // Offline phones ka stock kam karo
      for (const item of items) {
        if (item.productId) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product.modelType === "OFFLINE") {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }
      }

      return newOrder;
    });

    return order;
  },

  // ── Get Order By ID ──
  async getOrderById(id, user) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { modelName: true, images: true, brand: true } },
            usedPhone: { select: { modelName: true, images: true, brand: true } },
          },
        },
        store: { select: { storeName: true, phone: true, whatsappNumber: true } },
      },
    });

    if (!order) throw { statusCode: 404, message: "Order nahi mila." };

    // Access check
    if (user) {
      const isOwner = order.customerId === user.id;
      const isStoreOwner = user.role === "STORE_OWNER" && user.store?.id === order.storeId;
      const isAdmin = user.role === "SUPER_ADMIN";
      if (!isOwner && !isStoreOwner && !isAdmin) {
        throw { statusCode: 403, message: "Yeh order dekhne ki permission nahi." };
      }
    }

    return order;
  },

  // ── Get My Orders ──
  async getMyOrders(userId, query) {
    const { page = 1, limit = 10, status } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      customerId: userId,
      ...(status && { status: status.toUpperCase() }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, skip, take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: { select: { modelName: true, images: true, brand: true } },
              usedPhone: { select: { modelName: true, images: true, brand: true } },
            },
          },
          store: { select: { storeName: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total, page: Number(page), limit: Number(limit) };
  },

  // ── Get Store Orders ──
  async getStoreOrders(storeId, query) {
    const { page = 1, limit = 20, status } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      storeId,
      ...(status && { status: status.toUpperCase() }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, skip, take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: { select: { modelName: true, images: true, price: true } },
              usedPhone: { select: { modelName: true, images: true, askingPrice: true } },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total, page: Number(page), limit: Number(limit) };
  },

  // ── Update Order Status ──
  async updateOrderStatus(orderId, status, user) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw { statusCode: 404, message: "Order nahi mila." };

    if (user.role === "STORE_OWNER" && order.storeId !== user.store.id) {
      throw { statusCode: 403, message: "Yeh aapka order nahi hai." };
    }

    return await prisma.order.update({
      where: { id: orderId },
      data: { status: status.toUpperCase() },
    });
  },

  // ── Cancel Order ──
  async cancelOrder(orderId, user) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw { statusCode: 404, message: "Order nahi mila." };

    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
      throw { statusCode: 400, message: "Yeh order ab cancel nahi ho sakta." };
    }

    // Stock wapas karo
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });

      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        if (item.usedPhoneId) {
          await tx.usedPhone.update({
            where: { id: item.usedPhoneId },
            data: { isAvailable: true },
          });
        }
      }
    });

    return { message: "Order cancel ho gaya. Refund 5-7 din mein aayega." };
  },

  // ── Verify Delivery (OTP) ──
  async verifyDelivery(orderId, otp) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw { statusCode: 404, message: "Order nahi mila." };
    if (order.deliveryOTP !== otp) throw { statusCode: 400, message: "Galat OTP hai." };

    return await prisma.order.update({
      where: { id: orderId },
      data: { status: "DELIVERED", paymentStatus: "PAID" },
    });
  },
};

module.exports = orderService;
