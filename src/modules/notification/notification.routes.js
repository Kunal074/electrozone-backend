const express          = require("express");
const router           = express.Router();
const { authenticate } = require("../../middleware/auth");
const { requireStoreOwner, requireRole } = require("../../middleware/roleCheck");
const ctrl             = require("./notification.controller");

// App se token register karo
router.post("/register-token",   ctrl.registerToken);

// Store Owner — notification bhejo
router.post("/send",            authenticate, requireStoreOwner, ctrl.sendNotification);

// History dekho
router.get("/history",          authenticate, requireStoreOwner, ctrl.getHistory);

// Public — latest notifications
router.get("/latest",           ctrl.getLatest);

module.exports = router;