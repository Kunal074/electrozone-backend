const router = require("express").Router();
const ctrl = require("./product.controller");
const { authenticate, optionalAuth } = require("../../middleware/auth");
const { requireStoreOwner, requireRole } = require("../../middleware/roleCheck");

const { uploadImage } = require("../../config/cloudinary");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.post("/test-upload", upload.single("image"), async (req, res) => {
  const result = await uploadImage(req.file.path);
  res.json({ success: true, url: result.url });
});

// PUBLIC
router.get("/",                 optionalAuth, ctrl.getProducts);
router.get("/compare/:modelName", ctrl.compareByModel);
router.get("/:id",              optionalAuth, ctrl.getProductById);

// STORE OWNER
router.post("/",                authenticate, requireStoreOwner, ctrl.createProduct);
router.put("/:id",              authenticate, requireStoreOwner, ctrl.updateProduct);
router.delete("/:id",           authenticate, requireStoreOwner, ctrl.deleteProduct);
router.patch("/:id/stock",      authenticate, requireStoreOwner, ctrl.updateStock);

// ADMIN
router.patch("/:id/feature",    authenticate, requireRole("SUPER_ADMIN"), ctrl.toggleFeatured);

module.exports = router;