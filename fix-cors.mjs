import http from "http";
import { URL } from "url";
import { exec } from "child_process";

const CLIENT_ID = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";
const REDIRECT_URI = "http://localhost:9876";
const BUCKET = "zivox-70de2.firebasestorage.app";
const SCOPES = "https://www.googleapis.com/auth/cloud-platform";

const CORS_CONFIG = [
  {
    origin: ["*"],
    method: ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    maxAgeSeconds: 3600,
    responseHeader: [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "User-Agent",
      "x-goog-resumable",
      "x-firebase-storage-version",
    ],
  },
];

async function exchangeCodeForToken(code) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
  });
  return res.json();
}

async function setCors(accessToken) {
  const res = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${BUCKET}?fields=cors`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cors: CORS_CONFIG }),
    }
  );
  return { ok: res.ok, status: res.status, body: await res.text() };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:9876`);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<h2>Authentication failed: ${error}</h2><p>Please try again.</p>`);
    console.error("Authentication failed:", error);
    server.close();
    process.exit(1);
    return;
  }

  if (!code) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h2>No authorization code received</h2>");
    return;
  }

  console.log("Got authorization code, exchanging for token...");

  try {
    const tokenData = await exchangeCodeForToken(code);

    if (!tokenData.access_token) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`<h2>Failed to get access token</h2><pre>${JSON.stringify(tokenData, null, 2)}</pre>`);
      console.error("Token error:", tokenData);
      server.close();
      process.exit(1);
      return;
    }

    console.log("Got access token, setting CORS on bucket:", BUCKET);
    const result = await setCors(tokenData.access_token);

    if (result.ok) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`
        <html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#1a1a1a;color:#4ade80">
          <h1>✅ CORS Configured Successfully!</h1>
          <p style="color:#ccc">Firebase Storage bucket <b>${BUCKET}</b> now allows cross-origin requests.</p>
          <p style="color:#ccc">You can close this window and reload your app.</p>
          <pre style="text-align:left;background:#111;padding:16px;border-radius:8px;color:#fff;max-width:600px;margin:20px auto">${result.body}</pre>
        </html>
      `);
      console.log("✅ CORS configured successfully!");
      console.log("Response:", result.body);
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`
        <html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#1a1a1a;color:#ef4444">
          <h1>❌ Failed to set CORS (${result.status})</h1>
          <p style="color:#ccc">Make sure you sign in with the Google account that owns the Firebase project.</p>
          <pre style="text-align:left;background:#111;padding:16px;border-radius:8px;color:#fff;max-width:600px;margin:20px auto">${result.body}</pre>
        </html>
      `);
      console.error("❌ Failed to set CORS:", result.status, result.body);
    }
  } catch (err) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<h2>Error: ${err.message}</h2>`);
    console.error("Error:", err);
  }

  setTimeout(() => { server.close(); process.exit(0); }, 2000);
});

server.listen(9876, () => {
  const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPES)}&access_type=offline&prompt=consent`;

  console.log("");
  console.log("===========================================");
  console.log("  Firebase Storage CORS Configuration Tool");
  console.log("===========================================");
  console.log("");
  console.log("Opening browser for Google authentication...");
  console.log("Sign in with the account that owns project: zivox-70de2");
  console.log("");

  // Open browser on Windows
  exec(`start "" "${authUrl}"`);
});
