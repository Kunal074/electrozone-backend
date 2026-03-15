const router = require("express").Router();
const ctrl   = require("./store.controller");
const { authenticate, optionalAuth }        = require("../../middleware/auth");
const { requireStoreOwner, requireRole }    = require("../../middleware/roleCheck");

// PUBLIC
router.get("/",                    optionalAuth,  ctrl.getStores);

// STORE OWNER — /my routes PEHLE /:id se
router.get("/my",                  authenticate, requireStoreOwner,           ctrl.getMyStore);
router.put("/my",                  authenticate, requireStoreOwner,           ctrl.updateMyStore);
router.get("/my/tally-key",        authenticate, requireStoreOwner,           ctrl.getMyTallyKey);

// ADMIN
router.get("/admin/all",           authenticate, requireRole("SUPER_ADMIN"),  ctrl.getAllStores);
router.patch("/:id/approve",       authenticate, requireRole("SUPER_ADMIN"),  ctrl.approveStore);
router.patch("/:id/subscription",  authenticate, requireRole("SUPER_ADMIN"),  ctrl.updateSubscription);
router.post("/:id/tally-key",      authenticate, requireRole("SUPER_ADMIN"),  ctrl.generateTallyKey);

// PUBLIC — /:id sabse NEECHE
router.get("/:id",                 optionalAuth,  ctrl.getStoreById);

module.exports = router;