const router = require("express").Router();
const ctrl = require("./payment.controller");
const { authenticate, optionalAuth } = require("../../middleware/auth");

// Create Razorpay order
router.post("/create-order",    optionalAuth, ctrl.createPaymentOrder);

// Verify payment after success
router.post("/verify",          optionalAuth, ctrl.verifyPayment);

// Webhook — Razorpay se automatic calls aayenge
router.post("/webhook",         ctrl.webhook);

module.exports = router;