const { prisma } = require("../../config/db");

exports.getAllBanners = async () => {
  return await prisma.banner.findMany({
    where:   { isActive: true },
    orderBy: { order: "asc" },
  });
};

exports.addBanner = async (data) => {
  return await prisma.banner.create({ data });
};

exports.editBanner = async (id, data) => {
  return await prisma.banner.update({
    where: { id },
    data,
  });
};

exports.removeBanner = async (id) => {
  return await prisma.banner.delete({ where: { id } });
};