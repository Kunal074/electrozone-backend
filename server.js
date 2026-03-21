// server.js — Entry Point
require("dotenv").config();
require("express-async-errors");

const { execSync } = require("child_process");
const app          = require("./src/app");
const { connectDB } = require("./src/config/db");

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // // Auto migrate on startup
    // try {
    //   console.log("🔄 Running migrations...");
    //   execSync("npx prisma migrate deploy", { stdio: "inherit" });
    //   console.log("✅ Migrations done!");
    // } catch (migrateErr) {
    //   console.log("⚠️ Migration skip — continuing anyway!");
    // }

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