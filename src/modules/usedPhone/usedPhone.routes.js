const router = require("express").Router();
const ctrl = require("./usedPhone.controller");
const { authenticate, optionalAuth } = require("../../middleware/auth");
const { requireStoreOwner } = require("../../middleware/roleCheck");

// PUBLIC
router.get("/",          optionalAuth, ctrl.getUsedPhones);
router.get("/:id",       optionalAuth, ctrl.getUsedPhoneById);

// STORE OWNER
router.post("/",         authenticate, requireStoreOwner, ctrl.createUsedPhone);
router.put("/:id",       authenticate, requireStoreOwner, ctrl.updateUsedPhone);
router.delete("/:id",    authenticate, requireStoreOwner, ctrl.deleteUsedPhone);
router.patch("/:id/sold", authenticate, requireStoreOwner, ctrl.markAsSold);

module.exports = router;