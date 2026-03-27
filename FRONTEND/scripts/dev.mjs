import { spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(frontendDir, "..");
const backendHealthUrl =
  process.env.CIVICLENS_BACKEND_HEALTH_URL ?? "http://127.0.0.1:8000/api/health/";
const shouldSkipBackendStart = process.env.CIVICLENS_SKIP_BACKEND_START === "1";

async function isBackendHealthy() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(backendHealthUrl, {
      method: "GET",
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function waitForBackend() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await isBackendHealthy()) {
      return true;
    }

    await delay(1000);
  }

  return false;
}

function runBackendStartupScript() {
  return new Promise((resolve, reject) => {
    const child = spawn("bash", [path.join(repoRoot, "start_backend.sh")], {
      cwd: repoRoot,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`start_backend.sh exited with code ${code ?? "unknown"}`));
    });
  });
}

function startVite() {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const child = spawn(npmCommand, ["run", "dev:vite", "--", ...process.argv.slice(2)], {
    cwd: frontendDir,
    stdio: "inherit",
  });

  ["SIGINT", "SIGTERM", "SIGHUP"].forEach((signal) => {
    process.on(signal, () => {
      if (!child.killed) {
        child.kill(signal);
      }
    });
  });

  child.on("error", (error) => {
    console.error(`Failed to start Vite: ${error.message}`);
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

async function ensureBackend() {
  if (shouldSkipBackendStart) {
    console.log("Skipping backend startup because CIVICLENS_SKIP_BACKEND_START=1.");
    return;
  }

  if (await isBackendHealthy()) {
    console.log("Backend already reachable on http://127.0.0.1:8000.");
    return;
  }

  console.log("Backend is not reachable on http://127.0.0.1:8000. Starting it now...");
  await runBackendStartupScript();

  if (!(await waitForBackend())) {
    throw new Error("Backend did not become healthy after running start_backend.sh.");
  }

  console.log("Backend is ready. Starting Vite...");
}

async function main() {
  await ensureBackend();
  startVite();
}

main().catch((error) => {
  console.error(`Failed to prepare the frontend dev server: ${error.message}`);
  console.error("Check logs/backend.log and BACKEND/.venv if the backend did not start.");
  process.exit(1);
});
