import { performance } from "node:perf_hooks";

const baseUrl = process.env.PERFORMANCE_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
const url = new URL("/api/health/", baseUrl);
const totalRequests = 100;
const concurrency = 5;
const warmupRequests = 10;
const timeoutMs = 10_000;
const thresholdMs = 2_000;

async function sendRequest() {
  const start = performance.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    await response.text();
    return { duration: performance.now() - start, status: response.status };
  } catch (error) {
    return { duration: performance.now() - start, status: 0, error: error.message };
  }
}

function percentile(values, proportion) {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.ceil(proportion * sorted.length) - 1;
  return sorted[Math.max(index, 0)];
}

async function runTest() {
  console.log(`Endpoint: ${url}`);
  console.log(`Warming up with ${warmupRequests} requests...`);
  const warmups = await Promise.all(
    Array.from({ length: warmupRequests }, () => sendRequest())
  );
  const failedWarmups = warmups.filter((result) => result.status !== 200).length;

  console.log(`Measuring ${totalRequests} requests at concurrency ${concurrency}...`);
  const results = [];
  const testStart = performance.now();
  for (let index = 0; index < totalRequests; index += concurrency) {
    const batchSize = Math.min(concurrency, totalRequests - index);
    const batch = await Promise.all(
      Array.from({ length: batchSize }, () => sendRequest())
    );
    results.push(...batch);
  }

  const totalTime = performance.now() - testStart;
  const successful = results.filter((result) => result.status === 200);
  const failed = results.length - successful.length;
  const durations = successful.map((result) => result.duration);

  console.log("\n--- PERFORMANCE TEST RESULTS ---");
  console.log(`Measured requests: ${results.length}`);
  console.log(`Successful (HTTP 200): ${successful.length}`);
  console.log(`Failed: ${failed}`);
  console.log(`Failed warm-up requests: ${failedWarmups}`);
  console.log(`Total measurement time: ${(totalTime / 1000).toFixed(2)} seconds`);

  let p90 = null;
  if (durations.length > 0) {
    p90 = percentile(durations, 0.9);
    const average = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    console.log(`Average successful response time: ${average.toFixed(2)} ms`);
    console.log(`p90 successful response time: ${p90.toFixed(2)} ms`);
  } else {
    console.log("No successful measured responses; p90 cannot be calculated.");
  }

  const passed = failed === 0 && failedWarmups === 0 && p90 !== null && p90 <= thresholdMs;
  console.log(`Target (p90 <= ${thresholdMs} ms, no failed requests): ${passed ? "PASS" : "FAIL"}`);
  if (!passed) process.exitCode = 1;
}

runTest().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
