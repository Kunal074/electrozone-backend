const express          = require("express");
const router           = express.Router();
const { authenticate } = require("../../middleware/auth");
const { requireRole }  = require("../../middleware/roleCheck");
const bannerController = require("./banner.controller");

// Public
router.get("/", bannerController.getBanners);

// Admin only
router.post("/",      authenticate, requireRole("SUPER_ADMIN"), bannerController.createBanner);
router.put("/:id",    authenticate, requireRole("SUPER_ADMIN"), bannerController.updateBanner);
router.delete("/:id", authenticate, requireRole("SUPER_ADMIN"), bannerController.deleteBanner);

module.exports = router;