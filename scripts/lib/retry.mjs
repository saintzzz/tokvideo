// Exponential-backoff retry for flaky network ops (TTS, YouTube API).
// No deps — plain async wrapper. Fail loudly with the last error after
// exhausting attempts; callers decide whether the failure is fatal.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {() => Promise<T>} fn
 * @param {{ attempts?: number, baseMs?: number, label?: string,
 *           retryOn?: (err: any) => boolean }} [opts]
 */
export const withRetry = async (fn, opts = {}) => {
  const { attempts = 4, baseMs = 2000, label = "operation", retryOn } = opts;
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (retryOn && !retryOn(err)) throw err;
      if (i === attempts) break;
      // Full jitter — avoids thundering-herd when several files retry together.
      const wait = Math.round(baseMs * 2 ** (i - 1) * (0.5 + Math.random()));
      console.warn(
        `${label} failed (attempt ${i}/${attempts}): ${err?.message ?? err}. Retrying in ${wait}ms`
      );
      await sleep(wait);
    }
  }
  throw lastErr;
};
