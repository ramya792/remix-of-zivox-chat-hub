/**
 * set-cors.mjs — Sets CORS on Firebase Storage bucket
 * Usage:
 *   1. Run: firebase login
 *   2. Run: node set-cors.mjs
 */
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const BUCKET = "zivox-70de2.firebasestorage.app";
const CORS_FILE = "./cors.json";

async function getAccessToken() {
  const configPath = join(homedir(), ".config", "configstore", "firebase-tools.json");
  let config;
  try {
    config = JSON.parse(readFileSync(configPath, "utf8"));
  } catch {
    throw new Error("Firebase CLI not logged in. Run: firebase login");
  }

  const refreshToken = config?.tokens?.refresh_token;
  if (!refreshToken) {
    throw new Error("No refresh token found. Run: firebase login");
  }

  // Exchange refresh token for access token
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
      client_secret: "j9iVZfS8kkCEFUPaAeJV0sAi",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error("Failed to get access token: " + JSON.stringify(data));
  }
  return data.access_token;
}

async function setCors(accessToken) {
  const corsConfig = JSON.parse(readFileSync(CORS_FILE, "utf8"));

  const res = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${BUCKET}?fields=cors`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cors: corsConfig }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to set CORS (${res.status}): ${err}`);
  }

  const result = await res.json();
  console.log("✅ CORS configured successfully!");
  console.log(JSON.stringify(result, null, 2));
}

async function main() {
  console.log("🔑 Getting access token from Firebase CLI...");
  const token = await getAccessToken();
  console.log("📦 Setting CORS on bucket:", BUCKET);
  await setCors(token);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
