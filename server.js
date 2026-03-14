// server.js — Entry Point
require("dotenv").config();
require("express-async-errors");

const app = require("./src/app");
const { connectDB } = require("./src/config/db");

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║  ⚡ ElectroZone Backend Running!       ║
║  🌐 http://localhost:${PORT}             ║
║  📦 Database: Connected                ║
║  🔧 Mode: ${process.env.NODE_ENV}            ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error("❌ Server start failed:", err);
    process.exit(1);
  }
};

start();
