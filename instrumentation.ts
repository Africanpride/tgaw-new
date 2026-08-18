/**
 * Next.js Instrumentation Hook
 * Safely guards performance.measure calls against Turbopack dev HMR negative timestamp errors.
 */
export function register() {
  if (
    typeof globalThis.performance !== "undefined" &&
    typeof globalThis.performance.measure === "function" &&
    !(globalThis as any).__performanceMeasurePatched
  ) {
    const originalMeasure = globalThis.performance.measure.bind(globalThis.performance);
    globalThis.performance.measure = function (
      measureName: string,
      startMarkOrOptions?: string | PerformanceMeasureOptions,
      endMark?: string
    ) {
      try {
        return originalMeasure(measureName, startMarkOrOptions as any, endMark as any);
      } catch (err) {
        if (err instanceof Error && (err.message.includes("negative time stamp") || err.message.includes("negative"))) {
          return {} as PerformanceMeasure;
        }
        throw err;
      }
    };
    (globalThis as any).__performanceMeasurePatched = true;
  }
}

