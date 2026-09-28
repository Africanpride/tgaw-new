/**
 * Background reconnect loop for the Better Auth MongoClient.
 *
 * Why this exists: mongodb@7 leaves a *closed* topology on the client when the
 * FIRST connect attempt fails (autoConnect in operations/execute_operation.js
 * only reconnects while `client.topology == null`, and a failed connect keeps a
 * non-null closed topology). Every later operation in that process then throws
 * `MongoTopologyClosedError: Topology is closed` forever — on Vercel that meant
 * a transient Atlas outage poisoned serverless isolates until they were
 * recycled (observed prod incident: 15:05–15:17, 100+ auth 500s).
 *
 * Explicitly calling `client.connect()` again creates a fresh topology and
 * re-attempts (proven: a poisoned client's connect() throws a fresh
 * MongoServerSelectionError, not MongoTopologyClosedError), so a retry loop
 * around connect() fully heals the client once the server is reachable.
 */

export type ReconnectLoopStatus = "connected" | "given-up";

export interface ReconnectLoopResult {
	status: ReconnectLoopStatus;
	attempts: number;
	lastError?: unknown;
}

export interface ReconnectLoopHandle {
	/** Resolves once connected or once the loop gives up; never rejects. */
	done: Promise<ReconnectLoopResult>;
	/** Cancel any pending retry. */
	stop: () => void;
}

export interface StartReconnectLoopOptions {
	/** Typically `() => client.connect()`. */
	connect: () => Promise<unknown>;
	/** Return false to stop retrying (e.g. invalid connection string). */
	shouldRetry?: (error: unknown) => boolean;
	/** First retry delay; doubles each attempt (default 1000ms). */
	baseDelayMs?: number;
	/** Backoff cap (default 10000ms). */
	maxDelayMs?: number;
	/** Observability hook — errors thrown here are swallowed. */
	onRetry?: (error: unknown, attempt: number, nextDelayMs: number) => void;
}

const DEFAULT_BASE_DELAY_MS = 1_000;
const DEFAULT_MAX_DELAY_MS = 10_000;

export function startReconnectLoop(options: StartReconnectLoopOptions): ReconnectLoopHandle {
	const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
	const maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
	let attempts = 0;
	let stopped = false;
	let resolveDone: (result: ReconnectLoopResult) => void = () => {};
	const done = new Promise<ReconnectLoopResult>((resolve) => {
		resolveDone = resolve;
	});

	const schedule = (delayMs: number, run: () => void): void => {
		const timer = setTimeout(run, delayMs);
		// Never keep the process alive just for a retry (build exits, dev restarts).
		if (typeof timer === "object" && timer !== null && "unref" in timer) {
			(timer as { unref?: () => void }).unref?.();
		}
	};

	const run = async (): Promise<void> => {
		if (stopped) {
			resolveDone({ status: "given-up", attempts });
			return;
		}
		attempts++;
		try {
			await options.connect();
			resolveDone({ status: "connected", attempts });
		} catch (error) {
			if (options.shouldRetry && !options.shouldRetry(error)) {
				resolveDone({ status: "given-up", attempts, lastError: error });
				return;
			}
			const nextDelayMs = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempts - 1));
			try {
				options.onRetry?.(error, attempts, nextDelayMs);
			} catch {
				// observability must never break the loop
			}
			schedule(nextDelayMs, () => void run());
		}
	};

	void run();

	return {
		done,
		stop: () => {
			stopped = true;
		},
	};
}
