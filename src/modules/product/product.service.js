// src/modules/product/product.service.js
const { prisma } = require("../../config/db");

const productService = {

  // ── Get Products (with filters + pagination) ──
  async getProducts(query) {
    const {
      page = 1, limit = 20,
      category, brand, modelType,
      minPrice, maxPrice,
      inStock, isFeatured,
      search, sort = "createdAt",
      storeId,
    } = query;

    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      isActive: true,
      store: { isApproved: true, isActive: true },
      ...(category   && { category: category.toUpperCase() }),
      ...(brand      && { brand: { contains: brand, mode: "insensitive" } }),
      ...(modelType  && { modelType: modelType.toUpperCase() }),
      ...(storeId    && { storeId }),
      ...(isFeatured === "true" && { isFeatured: true }),
      ...(inStock === "true" && { stock: { gt: 0 } }),
      ...(search && {
        OR: [
          { modelName:   { contains: search, mode: "insensitive" } },
          { brand:       { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...((minPrice || maxPrice) && {
        price: {
          ...(minPrice && { gte: Number(minPrice) }),
          ...(maxPrice && { lte: Number(maxPrice) }),
        },
      }),
    };

    const orderBy = sort === "price_asc"  ? { price: "asc"  }
                  : sort === "price_desc" ? { price: "desc" }
                  : sort === "featured"   ? { isFeatured: "desc" }
                  :                        { createdAt: "desc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take: Number(limit),
        orderBy,
        include: {
          store: {
            select: {
              id: true, storeName: true, logo: true,
              rating: true, city: true,
              deliveryRadius: true, deliveryCharge: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total, page: Number(page), limit: Number(limit) };
  },

  // ── Get Single Product ──
  async getProductById(id) {
    const product = await prisma.product.findUnique({
      where: { id, isActive: true },
      include: {
        store: {
          select: {
            id: true, storeName: true, logo: true, phone: true,
            whatsappNumber: true, address: true, city: true,
            rating: true, totalReviews: true, openTime: true,
            closeTime: true, deliveryRadius: true, deliveryCharge: true,
            isCODAvailable: true, isApproved: true,
          },
        },
      },
    });

    if (!product || !product.store.isApproved) {
      throw { statusCode: 404, message: "Product nahi mila." };
    }

    return product;
  },

  // ── Compare Same Model Across Stores ──
  async compareByModel(modelName) {
    const products = await prisma.product.findMany({
      where: {
        modelName: { contains: modelName, mode: "insensitive" },
        isActive: true,
        store: { isApproved: true, isActive: true },
      },
      include: {
        store: {
          select: {
            id: true, storeName: true, logo: true, rating: true,
            city: true, latitude: true, longitude: true,
            whatsappNumber: true, deliveryRadius: true, deliveryCharge: true,
          },
        },
      },
      orderBy: { price: "asc" },
    });

    return products;
  },

  // ── Create Product ──
  async createProduct(data, user) {
    const storeId = user.store.id;

    const product = await prisma.product.create({
      data: {
        ...data,
        storeId,
        category: data.category.toUpperCase(),
        modelType: data.modelType?.toUpperCase() || "OFFLINE",
        price: Number(data.price),
        mrp: data.mrp ? Number(data.mrp) : null,
        stock: data.modelType === "ONLINE" ? 0 : Number(data.stock || 0),
      },
    });

    return product;
  },

  // ── Update Product ──
  async updateProduct(id, data, user) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw { statusCode: 404, message: "Product nahi mila." };

    // Store owner sirf apna product update kar sakta hai
    if (user.role === "STORE_OWNER" && product.storeId !== user.store.id) {
      throw { statusCode: 403, message: "Yeh aapka product nahi hai." };
    }

    return await prisma.product.update({ where: { id }, data });
  },

  // ── Delete Product ──
  async deleteProduct(id, user) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw { statusCode: 404, message: "Product nahi mila." };

    if (user.role === "STORE_OWNER" && product.storeId !== user.store.id) {
      throw { statusCode: 403, message: "Yeh aapka product nahi hai." };
    }

    // Soft delete — sirf isActive false karo
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return { message: "Product delete ho gaya." };
  },

  // ── Update Stock ──
  async updateStock(id, stock, user) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw { statusCode: 404, message: "Product nahi mila." };

    if (user.role === "STORE_OWNER" && product.storeId !== user.store.id) {
      throw { statusCode: 403, message: "Yeh aapka product nahi hai." };
    }

    return await prisma.product.update({
      where: { id },
      data: { stock: Number(stock) },
    });
  },

  // ── Toggle Featured ──
  async toggleFeatured(id, isFeatured, expiryDays = 30) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + Number(expiryDays));

    return await prisma.product.update({
      where: { id },
      data: {
        isFeatured,
        featuredExpiry: isFeatured ? expiry : null,
      },
    });
  },
};

module.exports = productService;
