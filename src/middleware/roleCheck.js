const { error } = require("../utils/apiResponse");

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, "Login karo pehle.", 401);
    }
    if (!roles.includes(req.user.role)) {
      return error(res, "Yeh karne ki permission nahi hai.", 403);
    }
    next();
  };
};

const requireStoreOwner = (req, res, next) => {
  if (!req.user) return error(res, "Login karo pehle.", 401);
  if (req.user.role !== "STORE_OWNER" && req.user.role !== "SUPER_ADMIN") {
    return error(res, "Store owner access required.", 403);
  }
  if (req.user.role === "STORE_OWNER" && !req.user.store?.isApproved) {
    return error(res, "Store abhi approved nahi hua hai.", 403);
  }
  next();
};

module.exports = { requireRole, requireStoreOwner };