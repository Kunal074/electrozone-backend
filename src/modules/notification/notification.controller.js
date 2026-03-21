const { success, error } = require("../../utils/apiResponse");
const { prisma }         = require("../../config/db");
const axios              = require("axios");

// ── Push Token Register ──
const registerToken = async (req, res) => {
  try {
    console.log("📱 Token register request:", req.body);
    const { token } = req.body;
    if (!token) return error(res, "Token zaroori hai", 400);

    await prisma.pushToken.upsert({
      where:  { token },
      update: { userId: req.user?.id || null },
      create: { token, userId: req.user?.id || null },
    });

    console.log("✅ Token saved:", token);
    success(res, null, "Token registered!");
  } catch (err) {
    console.error("❌ Token save error:", err.message);
    error(res, err.message);
  }
};

// ── Send Notification ──
const sendNotification = async (req, res) => {
  try {
    const { title, body, imageUrl, data } = req.body;

    if (!title || !body) return error(res, "Title aur body zaroori hai", 400);

    const tokens = await prisma.pushToken.findMany({
      select: { token: true }
    });

    console.log(`📱 Tokens found: ${tokens.length}`);

    if (tokens.length === 0) {
      return error(res, "Koi registered device nahi mila", 400);
    }

    const messages = tokens.map(({ token }) => ({
      to:    token,
      sound: "default",
      title,
      body,
      data:  data || {},
      ...(imageUrl && { image: imageUrl }),
    }));

    console.log(`📤 Sending messages:`, JSON.stringify(messages));

    const expRes = await axios.post(
      "https://exp.host/--/api/v2/push/send",
      messages,
      {
        headers: {
          "Accept":          "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type":    "application/json",
        }
      }
    );

    console.log(`✅ Expo response:`, JSON.stringify(expRes.data));

    // Save karo
    await prisma.notification.create({
      data: {
        title,
        body,
        imageUrl:  imageUrl || null,
        data:      data     || {},
        sentBy:    req.user.id,
        totalSent: tokens.length,
      }
    });

    // Auto cleanup — sirf 5 rakho
    const total = await prisma.notification.count();
    if (total > 5) {
      const old = await prisma.notification.findMany({
        orderBy: { sentAt: "desc" },
        skip:    5,
        select:  { id: true },
      });
      await prisma.notification.deleteMany({
        where: { id: { in: old.map(n => n.id) } }
      });
      console.log(`🗑️ Deleted ${total - 5} old notifications`);
    }

    success(res, { totalSent: tokens.length }, `Notification ${tokens.length} devices pe bhej di!`);
  } catch (err) {
    console.error("❌ Send error:", err.message);
    error(res, err.message);
  }
};

// ── Notification History — Latest 5 only ──
const getHistory = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { sentAt: "desc" },
      take:    5,
    });
    success(res, notifications);
  } catch (err) {
    error(res, err.message);
  }
};

// ── Latest Notifications (Public) ──
const getLatest = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { sentAt: "desc" },
      take:    5,
      select:  { title: true, body: true, imageUrl: true, sentAt: true }
    });
    success(res, notifications);
  } catch (err) {
    error(res, err.message);
  }
};

module.exports = { registerToken, sendNotification, getHistory, getLatest };