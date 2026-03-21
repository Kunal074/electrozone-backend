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

    // Saare tokens fetch karo
    const tokens = await prisma.pushToken.findMany({
      select: { token: true }
    });

    if (tokens.length === 0) {
      return error(res, "Koi registered device nahi mila", 400);
    }

    // Expo Push Notification format
    const messages = tokens.map(({ token }) => ({
      to:    token,
      sound: "default",
      title,
      body,
      data:  data || {},
      ...(imageUrl && { image: imageUrl }),
    }));

    // Expo server pe bhejo — batch mein (max 100)
    const batches = [];
    for (let i = 0; i < messages.length; i += 100) {
      batches.push(messages.slice(i, i + 100));
    }

    let totalSent = 0;
    for (const batch of batches) {
      const expRes = await axios.post(
        "https://exp.host/--/api/v2/push/send",
        batch,
        {
          headers: {
            "Accept":       "application/json",
            "Content-Type": "application/json",
          }
        }
      );
      totalSent += batch.length;
    }

    // History mein save karo
    await prisma.notification.create({
      data: {
        title,
        body,
        imageUrl: imageUrl || null,
        data:     data    || {},
        sentBy:   req.user.id,
        totalSent,
      }
    });

    success(res, { totalSent }, `Notification ${totalSent} devices pe bhej di!`);
  } catch (err) {
    error(res, err.message);
  }
};

// ── Notification History ──
const getHistory = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { sentAt: "desc" },
      take: 50,
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
      take: 10,
      select: { title: true, body: true, imageUrl: true, sentAt: true }
    });
    success(res, notifications);
  } catch (err) {
    error(res, err.message);
  }
};

module.exports = { registerToken, sendNotification, getHistory, getLatest };