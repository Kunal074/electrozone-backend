const router = require("express").Router();
const ctrl = require("./store.controller");
const { authenticate, optionalAuth } = require("../../middleware/auth");
const { requireStoreOwner, requireRole } = require("../../middleware/roleCheck");

// PUBLIC
router.get("/",          optionalAuth, ctrl.getStores);

// STORE OWNER
router.get("/my",  authenticate, requireStoreOwner, ctrl.getMyStore);
router.put("/my",  authenticate, requireStoreOwner, ctrl.updateMyStore);

// ADMIN
router.get("/admin/all", authenticate, requireRole("SUPER_ADMIN"), ctrl.getAllStores);
router.patch("/:id/approve", authenticate, requireRole("SUPER_ADMIN"), ctrl.approveStore);
router.patch("/:id/subscription", authenticate, requireRole("SUPER_ADMIN"), ctrl.updateSubscription);

// Tally API Key
router.post("/:id/tally-key", authenticate, requireRole("SUPER_ADMIN"), ctrl.generateTallyKey);
router.get("/my/tally-key",   authenticate, requireStoreOwner,          ctrl.getMyTallyKey);

// Public
router.get("/:id",       optionalAuth, ctrl.getStoreById);

module.exports = router;