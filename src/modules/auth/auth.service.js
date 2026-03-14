// src/modules/auth/auth.service.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../../config/db");

// ── Generate OTP ──
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ── Generate JWT Tokens ──
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || "24h" }
  );
  const refreshToken = jwt.sign(
    { userId, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || "30d" }
  );
  return { accessToken, refreshToken };
};

// ── Send OTP (Twilio ya Console log development mein) ──
const sendOTPToPhone = async (phone, otp) => {
  // Always console log karo — Render logs mein dikhega
  console.log(`\n📱 OTP for ${phone}: ${otp}\n`);

  // Twilio sirf tab bhejo jab configured ho
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    try {
      const twilio = require("twilio")(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      await twilio.messages.create({
        body: `ElectroZone: Your OTP is ${otp}. Valid for 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to:   `+91${phone}`,
      });
    } catch (e) {
      console.log("SMS send nahi hua:", e.message);
    }
  }
};

// ── Auth Service Methods ──
const authService = {

  // 1. Send OTP
  async sendOTP(phone) {
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Upsert user — agar nahi hai toh create, hai toh OTP update
    await prisma.user.upsert({
      where: { phone },
      update: { otp, otpExpiry },
      create: { phone, otp, otpExpiry, role: "CUSTOMER" },
    });

    await sendOTPToPhone(phone, otp);
    return { message: "OTP bhej diya gaya hai!" };
  },

  // 2. Verify OTP
  async verifyOTP(phone, otp, name) {
    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user) throw { statusCode: 404, message: "Phone number registered nahi hai." };
    if (!user.otp || !user.otpExpiry) throw { statusCode: 400, message: "Pehle OTP bhejo." };
    if (user.otp !== otp) throw { statusCode: 400, message: "Galat OTP hai." };
    if (new Date() > user.otpExpiry) throw { statusCode: 400, message: "OTP expire ho gaya. Dobara bhejo." };

    // OTP clear karo + lastLogin update
    const updatedUser = await prisma.user.update({
      where: { phone },
      data: {
        otp: null, otpExpiry: null,
        lastLogin: new Date(),
        name: name || user.name,
        isGuest: false,
      },
      include: { store: { select: { id: true, storeName: true, isApproved: true } } },
    });

    const tokens = generateTokens(updatedUser.id, updatedUser.role);
    return { user: sanitizeUser(updatedUser), ...tokens };
  },

  // 3. Register Store Owner
  async registerStoreOwner(data) {
    const { name, email, password, phone, storeName, storePhone, whatsappNumber, address, city, pincode } = data;

    // Check duplicates
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] }
    });
    if (existingUser) {
      throw { statusCode: 409, message: "Email ya phone already registered hai." };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // User + Store ek saath create karo (transaction)
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, phone, password: hashedPassword, role: "STORE_OWNER" },
      });
      const store = await tx.store.create({
        data: {
          storeName, phone: storePhone, whatsappNumber,
          address, city, pincode,
          ownerId: user.id,
          isApproved: false, // Super admin approve karega
        },
      });
      return { user, store };
    });

    return {
      message: "Registration successful! Super admin approval ka wait karo.",
      userId: result.user.id,
    };
  },

  // 4. Store Owner Login
  async storeLogin(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { store: true },
    });

    if (!user || !user.password) throw { statusCode: 401, message: "Email ya password galat hai." };
    if (!user.isActive) throw { statusCode: 403, message: "Account suspended." };

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw { statusCode: 401, message: "Email ya password galat hai." };

    if (user.role === "STORE_OWNER" && !user.store?.isApproved) {
      throw { statusCode: 403, message: "Store abhi approved nahi hua. Admin se contact karo." };
    }

    await prisma.user.update({ where: { email }, data: { lastLogin: new Date() } });

    const tokens = generateTokens(user.id, user.role);
    return { user: sanitizeUser(user), ...tokens };
  },

  // 5. Admin Login
  async adminLogin(phone, password) {
    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user || user.role !== "SUPER_ADMIN") {
      throw { statusCode: 401, message: "Invalid credentials." };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw { statusCode: 401, message: "Invalid credentials." };

    const tokens = generateTokens(user.id, user.role);
    return { user: sanitizeUser(user), ...tokens };
  },

  // 6. Refresh Token
  async refreshToken(token) {
    if (!token) throw { statusCode: 401, message: "Refresh token nahi mila." };
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) throw { statusCode: 401, message: "Invalid token." };
    const tokens = generateTokens(user.id, user.role);
    return tokens;
  },
};

// Password aur OTP hide karo response mein
const sanitizeUser = (user) => {
  const { password, otp, otpExpiry, ...safe } = user;
  return safe;
};

module.exports = authService;
