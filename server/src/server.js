require("dotenv").config();
const dns = require("dns");
const mongoose = require("mongoose");
const cron = require("node-cron");
const app = require("./app");
const {
  processRecurringRenewals,
} = require("./utils/recurringSubscriptionUtils");
const {
  checkScheduledOrderReminders,
} = require("./modules/order/services/orderCore.service");

const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGO_MAX_POOL_SIZE = Math.max(
  5,
  Number(process.env.MONGO_MAX_POOL_SIZE || 20),
);
const MONGO_MIN_POOL_SIZE = Math.max(
  1,
  Number(process.env.MONGO_MIN_POOL_SIZE || 2),
);
const MONGO_CONNECT_RETRY_MS = 15000;
let recurringRenewalJob = null;
let scheduledOrderReminderJob = null;

if (process.env.CUSTOM_DNS_SERVERS) {
  try {
    dns.setServers(process.env.CUSTOM_DNS_SERVERS.split(",").map((s) => s.trim()));
  } catch (dnsErr) {
    console.warn("Using system default DNS servers:", dnsErr.message);
  }
}

const dropLegacyUserIndexes = async () => {
  const allowedUserIndexes = new Set([
    "_id_",
    "email_1",
    "phone_1",
    "isBlacklisted_1",
  ]);
  const legacyFieldNames = new Set([
    "referralCode",
    "referredBy",
    "sponsorId",
    "affiliateId",
    "affiliateCode",
    "activationCode",
    "activationStatus",
    "walletBalance",
    "withdrawableBalance",
    "dkId",
    "eaId",
  ]);
  const legacyNameHints = [
    "referral",
    "affiliate",
    "activation",
    "wallet",
    "withdraw",
    "dkid",
    "eaid",
  ];

  try {
    const usersCollection = mongoose.connection.collection("users");
    const indexes = await usersCollection.indexes();
    const indexesToDrop = indexes.filter((index) => {
      const indexName = String(index?.name || "").trim();
      if (allowedUserIndexes.has(indexName)) return false;

      const fields = Object.keys(index?.key || {});
      if (!fields.length) return false;

      if (fields.some((field) => legacyFieldNames.has(field))) {
        return true;
      }

      const normalizedName = indexName.toLowerCase();
      return legacyNameHints.some((hint) => normalizedName.includes(hint));
    });

    if (!indexesToDrop.length) return;

    for (const index of indexesToDrop) {
      await usersCollection.dropIndex(index.name);
      console.log(`Dropped legacy users index: ${index.name}`);
    }
  } catch (error) {
    console.warn("Legacy index cleanup skipped:", error.message);
  }
};

const startBackgroundJobs = () => {
  if (!recurringRenewalJob) {
    recurringRenewalJob = cron.schedule("*/30 * * * *", async () => {
      try {
        const summary = await processRecurringRenewals({ limit: 100 });
        if ((summary?.processed || 0) > 0) {
          console.log("Recurring renewals processed:", summary);
        }
      } catch (jobError) {
        console.error("Recurring renewal job error:", jobError.message);
      }
    });
  }

  if (!scheduledOrderReminderJob) {
    checkScheduledOrderReminders().catch((err) =>
      console.error("Initial scheduled reminder check error:", err.message),
    );

    scheduledOrderReminderJob = cron.schedule("*/15 * * * *", async () => {
      try {
        const summary = await checkScheduledOrderReminders();
        if ((summary?.sent || 0) > 0) {
          console.log("Scheduled order delivery reminders sent:", summary);
        }
      } catch (jobError) {
        console.error("Scheduled order reminder job error:", jobError.message);
      }
    });
  }
};

const connectDatabase = async () => {
  if (!MONGODB_URI) {
    console.error(
      "FATAL: MONGODB_URI is not set. Add it to the .env file in the application root.",
    );
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: MONGO_MAX_POOL_SIZE,
      minPoolSize: MONGO_MIN_POOL_SIZE,
      maxIdleTimeMS: 60000,
      serverSelectionTimeoutMS: 10000,
    });
    console.log("Connected to MongoDB");
    await dropLegacyUserIndexes();
    startBackgroundJobs();
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message,
      error.cause?.message || "",
    );
    console.error(`Retrying in ${MONGO_CONNECT_RETRY_MS / 1000}s...`);
    setTimeout(connectDatabase, MONGO_CONNECT_RETRY_MS);
  }
};

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error("Server error:", error);
  }
  process.exit(1);
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB runtime error:", error.message);
});

connectDatabase();

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  if (recurringRenewalJob) {
    recurringRenewalJob.stop();
    recurringRenewalJob = null;
  }
  if (scheduledOrderReminderJob) {
    scheduledOrderReminderJob.stop();
    scheduledOrderReminderJob = null;
  }
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed");
    process.exit(0);
  });
});