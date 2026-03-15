const { prisma } = require("../../config/db");

const storeService = {

  // ── Get All Stores (Public) ──
  async getStores(query) {
    const { page = 1, limit = 20, city, search } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      isApproved: true,
      isActive: true,
      ...(city && { city: { contains: city, mode: "insensitive" } }),
      ...(search && { storeName: { contains: search, mode: "insensitive" } }),
    };

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where, skip, take: Number(limit),
        orderBy: { rating: "desc" },
        select: {
          id: true, storeName: true, logo: true,
          city: true, address: true, rating: true,
          totalReviews: true, subscriptionPlan: true,
          openTime: true, closeTime: true,
          deliveryRadius: true, deliveryCharge: true,
        },
      }),
      prisma.store.count({ where }),
    ]);

    return { stores, total, page: Number(page), limit: Number(limit) };
  },

  // ── Get Store By ID ──
  async getStoreById(id) {
    const store = await prisma.store.findUnique({
      where: { id, isApproved: true, isActive: true },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { isFeatured: "desc" },
          take: 20,
        },
        usedPhones: {
          where: { isAvailable: true },
          take: 10,
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            customer: { select: { name: true } },
          },
        },
      },
    });

    if (!store) throw { statusCode: 404, message: "Store nahi mila." };
    return store;
  },

  // ── Update My Store ──
  async updateMyStore(storeId, data) {
    const allowedFields = [
      "storeName", "logo", "address", "city", "pincode",
      "phone", "whatsappNumber", "deliveryRadius",
      "deliveryCharge", "isCODAvailable", "codAdvanceAmount",
      "openTime", "closeTime", "weeklyOff", "latitude", "longitude", "gstNumber",
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (data[field] !== undefined) updateData[field] = data[field];
    });

    return await prisma.store.update({
      where: { id: storeId },
      data: updateData,
    });
  },

  // ── Get All Stores (Admin) ──
  async getAllStores(query) {
    const { page = 1, limit = 20, isApproved } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      ...(isApproved !== undefined && {
        isApproved: isApproved === "true"
      }),
    };

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where, skip, take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          owner: { select: { name: true, email: true, phone: true } },
        },
      }),
      prisma.store.count({ where }),
    ]);

    return { stores, total, page: Number(page), limit: Number(limit) };
  },

  // ── Approve Store (Admin) ──
  async approveStore(id, isApproved) {
    return await prisma.store.update({
      where: { id },
      data: {
        isApproved,
        approvedAt: isApproved ? new Date() : null,
      },
    });
  },

  // ── Update Subscription (Admin) ──
  async updateSubscription(id, plan, expiryDays = 30) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + Number(expiryDays));

    return await prisma.store.update({
      where: { id },
      data: {
        subscriptionPlan: plan.toUpperCase(),
        subscriptionExpiry: expiry,
      },
    });
  },
};

module.exports = storeService;