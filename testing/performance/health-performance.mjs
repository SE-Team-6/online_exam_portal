import { performance } from "node:perf_hooks";

const URL = "http://localhost:3000/api/health/";
const TOTAL_REQUESTS = 100;
const CONCURRENCY = 5;
const WARMUP_REQUESTS = 10;

async function sendRequest() {
  const start = performance.now();

  try {
    const response = await fetch(URL);
    await response.text();

    return {
      duration: performance.now() - start,
      status: response.status,
    };
  } catch (error) {
    return {
      duration: performance.now() - start,
      status: 0,
      error: error.message,
    };
  }
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function runTest() {
  console.log("Warming up...");
  for (let i = 0; i < WARMUP_REQUESTS; i++) {
    await sendRequest();
  }

  console.log(`Running ${TOTAL_REQUESTS} requests with concurrency ${CONCURRENCY}...`);

  const results = [];
  const testStart = performance.now();

  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENCY) {
    const batchSize = Math.min(CONCURRENCY, TOTAL_REQUESTS - i);
    const batch = await Promise.all(
      Array.from({ length: batchSize }, () => sendRequest())
    );
    results.push(...batch);
  }

  const totalTime = performance.now() - testStart;
  const successful = results.filter((r) => r.status === 200);
  const failed = results.length - successful.length;
  const durations = successful.map((r) => r.duration);

  console.log("\n--- PERFORMANCE TEST RESULTS ---");
  console.log(`Total requests: ${results.length}`);
  console.log(`Successful (HTTP 200): ${successful.length}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total test time: ${(totalTime / 1000).toFixed(2)} seconds`);

  if (durations.length > 0) {
    const p90 = percentile(durations, 0.90);
    console.log(`Average response time: ${(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2)} ms`);
    console.log(`p90 response time: ${p90.toFixed(2)} ms`);
    console.log(`Target (p90 <= 2000 ms): ${p90 <= 2000 ? "PASS" : "FAIL"}`);
  } else {
    console.log("No successful responses; p90 cannot be calculated.");
  }
}

runTest();