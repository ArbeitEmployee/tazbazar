/**
 * Lightweight CI smoke test.
 * Boots the real server entrypoint (src/server.js) against a test database,
 * verifies the API responds on public endpoints, then shuts down.
 *
 * Usage:  MONGODB_URI=mongodb://localhost:27017/ecomci node scripts/ci-smoke.js
 */
const { spawn } = require("child_process");
const path = require("path");

const PORT = process.env.SMOKE_PORT || "4399";
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is required to run the CI smoke test");
  process.exit(1);
}

const child = spawn(process.execPath, ["src/server.js"], {
  cwd: path.resolve(__dirname, ".."),
  env: { ...process.env, PORT, MONGODB_URI, NODE_ENV: "test" },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverLog = "";
child.stdout.on("data", (d) => (serverLog += String(d)));
child.stderr.on("data", (d) => (serverLog += String(d)));

const base = `http://127.0.0.1:${PORT}/api`;

async function waitForServer(timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null && child.exitCode !== 0) {
      console.error("Server exited early. Log:\n" + serverLog);
      process.exit(1);
    }
    try {
      const res = await fetch(`${base}/categories/public`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return true;
    } catch (err) {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.error("Server did not become ready in time. Log:\n" + serverLog);
  process.exit(1);
}

async function main() {
  await waitForServer();

  const checks = [
    ["GET", "/categories/public", [200], null],
    ["GET", "/products/public", [200], null],
    ["GET", "/products/public/home-catalog", [200], null],
    ["GET", "/banners/public", [200], null],
    ["GET", "/brands/public", [200], null],
    ["GET", "/auth/register/availability?email=nobody@test.com", [200], null],
    ["POST", "/shipping/estimate", [200, 404], { district: "Dhaka", area: "Dhanmondi", weight: 1 }],
  ];

  let failed = 0;
  for (const [method, ep, accepted, body] of checks) {
    try {
      const res = await fetch(base + ep, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const ok = accepted.includes(res.status);
      console.log(`${ok ? "PASS" : "FAIL"} ${method} ${ep} -> ${res.status}`);
      if (!ok) failed += 1;
    } catch (err) {
      console.log(`FAIL ${method} ${ep} -> ${err.message}`);
      failed += 1;
    }
  }

  child.kill("SIGTERM");
  console.log(failed === 0 ? `\nSMOKE OK (${checks.length} checks)` : `\nSMOKE FAILED (${failed}/${checks.length})`);
  process.exit(failed === 0 ? 0 : 1);
}

child.on("exit", (code) => {
  if (code !== null && code !== 0) {
    console.error("Server crashed during smoke test. Log:\n" + serverLog);
    process.exit(1);
  }
});

main().catch((err) => {
  child.kill("SIGTERM");
  console.error("Smoke test error:", err.message);
  process.exit(1);
});