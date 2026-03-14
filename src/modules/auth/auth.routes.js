const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("./auth.controller");
const { authenticate } = require("../../middleware/auth");

// Customer OTP Login
router.post("/send-otp",
  [body("phone").isMobilePhone("en-IN").withMessage("Valid Indian phone number chahiye")],
  ctrl.sendOTP
);

router.post("/verify-otp",
  [
    body("phone").isMobilePhone("en-IN"),
    body("otp").isLength({ min: 6, max: 6 }).withMessage("6 digit OTP chahiye"),
    body("name").optional().trim(),
  ],
  ctrl.verifyOTP
);

// Store Owner
router.post("/store/register",
  [
    body("name").trim().notEmpty().withMessage("Naam chahiye"),
    body("email").isEmail().withMessage("Valid email chahiye"),
    body("password").isLength({ min: 6 }).withMessage("Password minimum 6 characters"),
    body("phone").isMobilePhone("en-IN"),
    body("storeName").trim().notEmpty().withMessage("Store naam chahiye"),
    body("storePhone").isMobilePhone("en-IN"),
    body("whatsappNumber").isMobilePhone("en-IN"),
    body("address").trim().notEmpty(),
    body("city").trim().notEmpty(),
    body("pincode").isLength({ min: 6, max: 6 }),
  ],
  ctrl.registerStoreOwner
);

router.post("/store/login",
  [
    body("email").isEmail(),
    body("password").notEmpty(),
  ],
  ctrl.storeLogin
);

// Admin Login
router.post("/admin/login",
  [
    body("phone").isMobilePhone("en-IN"),
    body("password").notEmpty(),
  ],
  ctrl.adminLogin
);

// Refresh Token
router.post("/refresh", ctrl.refreshToken);

// Logout
router.post("/logout", authenticate, ctrl.logout);

// Get current user
router.get("/me", authenticate, ctrl.getMe);

module.exports = router;