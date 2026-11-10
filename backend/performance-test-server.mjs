import app from "./src/app.js";

const port = Number(process.env.PERFORMANCE_SERVER_PORT ?? 3001);

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PERFORMANCE_SERVER_PORT must be a valid TCP port number");
}

app.listen(port, "127.0.0.1", () => {
  console.log(`Local performance-test server listening on http://127.0.0.1:${port}`);
});
