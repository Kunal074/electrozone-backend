const { prisma } = require("../../config/db");

const usedPhoneService = {

  // ── Get Used Phones (with filters) ──
  async getUsedPhones(query) {
    const {
      page = 1, limit = 20,
      brand, conditionGrade,
      minPrice, maxPrice,
      search, storeId,
      sort = "createdAt",
    } = query;

    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      isAvailable: true,
      store: { isApproved: true, isActive: true },
      ...(brand && { brand: { contains: brand, mode: "insensitive" } }),
      ...(conditionGrade && { conditionGrade: conditionGrade.toUpperCase() }),
      ...(storeId && { storeId }),
      ...(search && {
        OR: [
          { modelName: { contains: search, mode: "insensitive" } },
          { brand: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...((minPrice || maxPrice) && {
        askingPrice: {
          ...(minPrice && { gte: Number(minPrice) }),
          ...(maxPrice && { lte: Number(maxPrice) }),
        },
      }),
    };

    const orderBy = sort === "price_asc"  ? { askingPrice: "asc"  }
                  : sort === "price_desc" ? { askingPrice: "desc" }
                  :                        { createdAt: "desc" };

    const [usedPhones, total] = await Promise.all([
      prisma.usedPhone.findMany({
        where, skip, take: Number(limit),
        orderBy,
        include: {
          store: {
            select: {
              id: true, storeName: true, logo: true,
              rating: true, city: true, whatsappNumber: true,
            },
          },
        },
      }),
      prisma.usedPhone.count({ where }),
    ]);

    return { usedPhones, total, page: Number(page), limit: Number(limit) };
  },

  // ── Get Single Used Phone ──
  async getUsedPhoneById(id) {
    const usedPhone = await prisma.usedPhone.findUnique({
      where: { id, isAvailable: true },
      include: {
        store: {
          select: {
            id: true, storeName: true, logo: true, phone: true,
            whatsappNumber: true, address: true, city: true,
            rating: true, totalReviews: true,
            openTime: true, closeTime: true,
          },
        },
      },
    });

    if (!usedPhone) throw { statusCode: 404, message: "Used phone nahi mila." };

    // Views increment karo
    await prisma.usedPhone.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return usedPhone;
  },

  // ── Create Used Phone ──
  async createUsedPhone(data, user) {
    if (data.images?.length < 4) {
      throw { statusCode: 400, message: "Minimum 4 photos chahiye." };
    }

    return await prisma.usedPhone.create({
      data: {
        ...data,
        storeId: user.store.id,
        conditionGrade: data.conditionGrade.toUpperCase(),
        askingPrice: Number(data.askingPrice),
      },
    });
  },

  // ── Update Used Phone ──
  async updateUsedPhone(id, data, user) {
    const usedPhone = await prisma.usedPhone.findUnique({ where: { id } });
    if (!usedPhone) throw { statusCode: 404, message: "Used phone nahi mila." };

    if (user.role === "STORE_OWNER" && usedPhone.storeId !== user.store.id) {
      throw { statusCode: 403, message: "Yeh aapka listing nahi hai." };
    }

    return await prisma.usedPhone.update({ where: { id }, data });
  },

  
  // ── Delete Used Phone ──
async deleteUsedPhone(id, user) {
  const usedPhone = await prisma.usedPhone.findUnique({ where: { id } });
  if (!usedPhone) throw { statusCode: 404, message: "Used phone nahi mila." };

  if (user.role === "STORE_OWNER" && usedPhone.storeId !== user.store.id) {
    throw { statusCode: 403, message: "Yeh aapka listing nahi hai." };
  }

  // Cloudinary se images delete karo
  if (usedPhone.images?.length > 0) {
    const { deleteImage } = require("../../config/cloudinary");
    for (const imageUrl of usedPhone.images) {
      try {
        const parts   = imageUrl.split("/");
        const upload  = parts.indexOf("upload");
        if (upload !== -1) {
          const afterUpload = parts.slice(upload + 1);
          if (afterUpload[0]?.startsWith("v")) afterUpload.shift();
          const publicId = afterUpload.join("/").replace(/\.[^/.]+$/, "");
          await deleteImage(publicId);
          console.log(`🗑️ Deleted: ${publicId}`);
        }
      } catch (err) {
        console.log(`⚠️ Image delete failed: ${err.message}`);
      }
    }
  }

  // Database se permanently delete karo
  await prisma.usedPhone.delete({ where: { id } });

  return { message: "Listing aur images delete ho gayi!" };
},

  
  // ── Mark As Sold ──
async markAsSold(id, user) {
  const usedPhone = await prisma.usedPhone.findUnique({ where: { id } });
  if (!usedPhone) throw { statusCode: 404, message: "Used phone nahi mila." };

  if (user.role === "STORE_OWNER" && usedPhone.storeId !== user.store.id) {
    throw { statusCode: 403, message: "Yeh aapka listing nahi hai." };
  }

  // ── Cloudinary se images delete karo ──
  if (usedPhone.images?.length > 0) {
    const { deleteImage } = require("../../config/cloudinary");
    for (const imageUrl of usedPhone.images) {
      try {
        // URL se public_id nikalo
        // URL format: https://res.cloudinary.com/cloud/image/upload/v123/folder/filename.jpg
        const parts   = imageUrl.split("/");
        const upload  = parts.indexOf("upload");
        if (upload !== -1) {
          // version skip karo (v123)
          const afterUpload = parts.slice(upload + 1);
          if (afterUpload[0]?.startsWith("v")) afterUpload.shift();
          const publicId = afterUpload.join("/").replace(/\.[^/.]+$/, "");
          await deleteImage(publicId);
          console.log(`🗑️ Deleted: ${publicId}`);
        }
      } catch (err) {
        console.log(`⚠️ Image delete failed: ${err.message}`);
      }
    }
  }

  // ── Database se bhi permanently delete karo ──
  await prisma.usedPhone.delete({ where: { id } });

  return { message: "Phone sold mark ho gaya aur images delete ho gayi!" };
},
};

module.exports = usedPhoneService;