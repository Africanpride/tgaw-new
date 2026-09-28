// scripts/lib/cli.ts
//
// Shared command-line helpers for scripts/backup-mongo.ts and
// scripts/restore-mongo.ts. Keeping them here means both scripts guard
// themselves identically (one place to audit, one place to change).

/**
 * Returns the value that follows a flag in argv, e.g. for
 * `--key secret` called as getArg("--key") it returns "secret".
 * Returns undefined when the flag is not present.
 */
export function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index === -1 ? undefined : process.argv[index + 1]
}

/**
 * Validates `--key <value>` against DB_BACKUP_KEY (from .env).
 *
 * On a missing flag, missing env var, or mismatch it prints an [ERROR]
 * line and exits with code 1 — before any network connection is opened —
 * so an accidental run can never touch a database. Returns the key on
 * success (callers that do not need it can ignore the return value).
 */
export function requireBackupKey(): string {
  const key = getArg("--key")
  if (!key || !process.env.DB_BACKUP_KEY || key !== process.env.DB_BACKUP_KEY) {
    console.error(
      "[ERROR] Missing or invalid --key (expected --key <DB_BACKUP_KEY> from .env)"
    )
    // Exit code 1 = failure, so shell scripts and CI can detect it.
    process.exit(1)
  }
  return key
}
