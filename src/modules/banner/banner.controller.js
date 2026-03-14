const { success, error: sendError } = require("../../utils/apiResponse");
const { prisma } = require("../../config/db");

const getBanners = async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      where:   { isActive: true },
      orderBy: { order: "asc" },
    });
    success(res, banners);
  } catch (err) {
    sendError(res, err.message);
  }
};

const createBanner = async (req, res) => {
  try {
    const banner = await prisma.banner.create({ data: req.body });
    success(res, banner, "Banner add ho gaya!");
  } catch (err) {
    sendError(res, err.message);
  }
};

const updateBanner = async (req, res) => {
  try {
    const banner = await prisma.banner.update({
      where: { id: req.params.id },
      data:  req.body,
    });
    success(res, banner, "Banner update ho gaya!");
  } catch (err) {
    sendError(res, err.message);
  }
};

const deleteBanner = async (req, res) => {
  try {
    await prisma.banner.delete({ where: { id: req.params.id } });
    success(res, null, "Banner delete ho gaya!");
  } catch (err) {
    sendError(res, err.message);
  }
};

module.exports = { getBanners, createBanner, updateBanner, deleteBanner };