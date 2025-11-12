// api/withdraw.js
import fetch from "node-fetch";
import fs from "fs";

const DB_FILE = "./withdrawals.json";
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ withdraws: [] }, null, 2));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

  const body = req.body;

  if (!body.telegram_id) {
    return res.status(400).json({ ok: false, error: "Missing telegram_id" });
  }

  // Save locally (demo)
  const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  const entry = {
    id: Date.now(),
    user_id: body.telegram_id,
    username: body.username || "N/A",
    amount: body.amount || 0,
    payment_method: body.payment_method || "N/A",
    wallet_address: body.wallet_address || "N/A",
    date: new Date().toISOString(),
    status: "pending",
  };
  db.withdraws.push(entry);
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

  // Notify admin on Telegram
  const msg = `💸 *New Withdraw Request*\n👤 User: ${entry.username} (ID: ${entry.user_id})\n💰 Amount: ${entry.amount} Coins\n🏦 Method: ${entry.payment_method}\n📱 Account: ${entry.wallet_address}\n🕒 ${entry.date}`;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: msg, parse_mode: "Markdown" }),
    });
  } catch (err) {
    console.error("Telegram send error:", err);
  }

  return res.status(200).json({ ok: true, message: "Withdraw request saved!", entry });
    }
