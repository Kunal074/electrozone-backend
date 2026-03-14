const router = require("express").Router();
const ctrl = require("./store.controller");
const { authenticate, optionalAuth } = require("../../middleware/auth");
const { requireStoreOwner, requireRole } = require("../../middleware/roleCheck");

// PUBLIC
router.get("/",          optionalAuth, ctrl.getStores);
router.get("/:id",       optionalAuth, ctrl.getStoreById);

// STORE OWNER
router.put("/my",        authenticate, requireStoreOwner, ctrl.updateMyStore);

// ADMIN
router.get("/admin/all", authenticate, requireRole("SUPER_ADMIN"), ctrl.getAllStores);
router.patch("/:id/approve", authenticate, requireRole("SUPER_ADMIN"), ctrl.approveStore);
router.patch("/:id/subscription", authenticate, requireRole("SUPER_ADMIN"), ctrl.updateSubscription);

module.exports = router;