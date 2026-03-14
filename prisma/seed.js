const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123456", 12);

  const admin = await prisma.user.upsert({
    where: { phone: "9999999998" },
    update: {},
    create: {
      name:     "Super Admin",
      phone:    "9999999998",
      email:    "admin@electrozone.com",
      password: hashedPassword,
      role:     "SUPER_ADMIN",
      isGuest:  false,
    },
  });

  console.log("✅ Super Admin created:", admin.phone);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });