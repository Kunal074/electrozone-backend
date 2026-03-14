// src/app.js — Express App Setup
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

// ── SECURITY MIDDLEWARE ──
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: false,
}));

// ── REQUEST PARSING ──
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── LOGGING ──
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ── HEALTH CHECK ──
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "⚡ ElectroZone API is running!",
    version: "1.0.0",
    endpoints: {
      auth:      "/api/auth",
      stores:    "/api/stores",
      products:  "/api/products",
      usedPhones:"/api/used-phones",
      orders:    "/api/orders",
      payments:  "/api/payments",
      admin:     "/api/admin",
    }
  });
});

// ── ROUTES ──

app.use("/api/auth",        require("./modules/auth/auth.routes"));
app.use("/api/stores",      require("./modules/store/store.routes"));
app.use("/api/products",    require("./modules/product/product.routes"));
app.use("/api/used-phones", require("./modules/usedPhone/usedPhone.routes"));
app.use("/api/orders",      require("./modules/order/order.routes"));
app.use("/api/payments",    require("./modules/payment/payment.routes"));
app.use("/api/banners",     require("./modules/banner/banner.routes"));

// ── ERROR HANDLING ──
app.use(notFound);
app.use(errorHandler);

module.exports = app;
