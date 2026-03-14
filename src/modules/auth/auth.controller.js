const { validationResult } = require("express-validator");
const authService = require("./auth.service");
const { success, error } = require("../../utils/apiResponse");

const authController = {

  async sendOTP(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return error(res, "Validation failed", 400, errors.array());
    const result = await authService.sendOTP(req.body.phone);
    success(res, result, "OTP bhej diya gaya!");
  },

  async verifyOTP(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return error(res, "Validation failed", 400, errors.array());
    const { phone, otp, name } = req.body;
    const result = await authService.verifyOTP(phone, otp, name);
    success(res, result, "Login successful!");
  },

  async registerStoreOwner(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return error(res, "Validation failed", 400, errors.array());
    const result = await authService.registerStoreOwner(req.body);
    success(res, result, "Store registration successful!", 201);
  },

  async storeLogin(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return error(res, "Validation failed", 400, errors.array());
    const { email, password } = req.body;
    const result = await authService.storeLogin(email, password);
    success(res, result, "Login successful!");
  },

  async adminLogin(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return error(res, "Validation failed", 400, errors.array());
    const { phone, password } = req.body;
    const result = await authService.adminLogin(phone, password);
    success(res, result, "Admin login successful!");
  },

  async refreshToken(req, res) {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    success(res, result, "Token refresh successful!");
  },

  async logout(req, res) {
    success(res, {}, "Logout successful!");
  },

  async getMe(req, res) {
    success(res, req.user, "User data milgaya!");
  },
};

module.exports = authController;