import { describe, expect, it } from "bun:test";
import { startReconnectLoop } from "./mongoRecovery";

const tick = () => new Promise((r) => setTimeout(r, 20));

describe("startReconnectLoop", () => {
	it("resolves after a failed first attempt once connect succeeds", async () => {
		let calls = 0;
		const loop = startReconnectLoop({
			connect: async () => {
				calls++;
				if (calls < 3) throw new Error("Topology is closed");
			},
			baseDelayMs: 1,
			maxDelayMs: 5,
		});

		const result = await loop.done;
		expect(result.status).toBe("connected");
		expect(result.attempts).toBe(3);
		expect(calls).toBe(3);

		// stops retrying after success
		await tick();
		expect(calls).toBe(3);
	});

	it("stops immediately when the error is not retryable", async () => {
		let calls = 0;
		const loop = startReconnectLoop({
			connect: async () => {
				calls++;
				throw new Error("Invalid connection string");
			},
			shouldRetry: () => false,
			baseDelayMs: 1,
		});

		const result = await loop.done;
		expect(result.status).toBe("given-up");
		expect(result.attempts).toBe(1);
		expect(calls).toBe(1);
	});

	it("reports each retry with attempt number and backoff delay", async () => {
		const retries: Array<{ attempt: number; delayMs: number }> = [];
		let calls = 0;
		const loop = startReconnectLoop({
			connect: async () => {
				calls++;
				if (calls < 3) throw new Error("MongoServerSelectionError");
			},
			baseDelayMs: 2,
			maxDelayMs: 50,
			onRetry: (_error, attempt, delayMs) => {
				retries.push({ attempt, delayMs });
			},
		});

		await loop.done;
		expect(retries).toEqual([
			{ attempt: 1, delayMs: 2 },
			{ attempt: 2, delayMs: 4 },
		]);
	});

	it("caps exponential backoff at maxDelayMs", async () => {
		const delays: number[] = [];
		let calls = 0;
		const loop = startReconnectLoop({
			connect: async () => {
				calls++;
				if (calls < 6) throw new Error("still down");
			},
			baseDelayMs: 2,
			maxDelayMs: 5,
			onRetry: (_error, _attempt, delayMs) => {
				delays.push(delayMs);
			},
		});

		await loop.done;
		expect(delays).toEqual([2, 4, 5, 5, 5]);
	});

	it("keeps running through unexpected onRetry errors", async () => {
		let calls = 0;
		const loop = startReconnectLoop({
			connect: async () => {
				calls++;
				if (calls < 2) throw new Error("boom");
			},
			baseDelayMs: 1,
			onRetry: () => {
				throw new Error("logger exploded");
			},
		});

		const result = await loop.done;
		expect(result.status).toBe("connected");
		expect(calls).toBe(2);
	});

	it("stop() prevents further attempts", async () => {
		let calls = 0;
		const loop = startReconnectLoop({
			connect: async () => {
				calls++;
				throw new Error("down");
			},
			baseDelayMs: 30,
			maxDelayMs: 30,
		});

		loop.stop();
		await loop.done;
		expect(calls).toBeLessThanOrEqual(1);
	});
});
