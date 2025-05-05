/**
 * Measures the execution time of the given code and logs it to the console.
 * @param label Log label.
 * @param action Code to measure.
 * @returns Code result.
 */
export function logPerformance<TResult>(label: string, action: () => TResult) {
    const startMilliseconds = performance.now();
    const result = action();
    const elapsedMilliseconds = performance.now() - startMilliseconds;
    console.log(`at ${(startMilliseconds % 10_000).toFixed(4).padStart(9, "0")} PERFORMANCE: ${elapsedMilliseconds.toFixed(4)} ms, ${label}`);
    return result;
}