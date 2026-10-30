import "dotenv/config";
import { readFileSync } from "node:fs";
import https from "node:https";
import app from "./app.js";
import { connectToDatabase } from "./config/database.js";

const port = Number(process.env.PORT ?? 3000);
const keyPath = process.env.TLS_KEY_PATH;
const certPath = process.env.TLS_CERT_PATH;

if (Boolean(keyPath) !== Boolean(certPath)) {
  throw new Error("TLS_KEY_PATH and TLS_CERT_PATH must be configured together");
}
if (process.env.NODE_ENV === "production" && !keyPath && process.env.TLS_TERMINATED_BY_PROXY !== "true") {
  throw new Error("Production requires TLS_KEY_PATH/TLS_CERT_PATH or TLS_TERMINATED_BY_PROXY=true");
}

try {
  await connectToDatabase();

  const server = keyPath
    ? https.createServer({
        key: readFileSync(keyPath),
        cert: readFileSync(certPath),
        minVersion: "TLSv1.2",
      }, app)
    : app;
  server.listen(port, () => {
    console.log(`${keyPath ? "HTTPS" : "HTTP"} backend listening on port ${port}`);
  });
} catch {
  console.error("Could not start backend. Check MongoDB availability and TLS certificate configuration.");
  process.exit(1);
}
