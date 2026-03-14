const router = require("express").Router();
const ctrl = require("./order.controller");
const { authenticate, optionalAuth } = require("../../middleware/auth");
const { requireStoreOwner } = require("../../middleware/roleCheck");

// Customer
router.post("/",                    optionalAuth, ctrl.createOrder);
router.get("/my",                   authenticate, ctrl.getMyOrders);
router.get("/:id",                  optionalAuth, ctrl.getOrderById);
router.put("/:id/cancel",           optionalAuth, ctrl.cancelOrder);

// Store Owner
router.get("/store/all",            authenticate, requireStoreOwner, ctrl.getStoreOrders);
router.put("/:id/status",           authenticate, requireStoreOwner, ctrl.updateOrderStatus);

// Delivery confirm
router.post("/:id/verify-delivery", authenticate, ctrl.verifyDelivery);

module.exports = router;