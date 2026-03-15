const express        = require("express");
const router         = express.Router();
const { authenticate } = require("../../middleware/auth");
const { requireStoreOwner } = require("../../middleware/roleCheck");
const controller     = require("./offlineSale.controller");

// Store Owner routes
router.post("/",           authenticate, requireStoreOwner, controller.createSale);
router.get("/store",       authenticate, requireStoreOwner, controller.getStoreSales);
router.get("/:id",         authenticate, requireStoreOwner, controller.getSale);
router.delete("/:id",      authenticate, requireStoreOwner, controller.deleteSale);

// Customer route — apni purchases dekho
router.get("/my/purchases", authenticate, controller.getMyPurchases);

module.exports = router;