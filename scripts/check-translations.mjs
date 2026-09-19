#!/usr/bin/env node
/**
 * check-translations.mjs — translation key lint (translation.md verification plan).
 *
 * Loads messages/en/*.json as the baseline and compares each fr|es|pt file:
 *  - missing keys (exit non-zero)
 *  - extra keys (warning only)
 *  - mismatched {{interpolation}} variables (warning only)
 *
 * Usage: node scripts/check-translations.mjs
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, "..", "messages");
const BASELINE_LOCALE = "en";
const TARGET_LOCALES = ["fr", "es", "pt"];

function flatten(obj, prefix = "", out = {}) {
	if (obj === null || obj === undefined) return out;
	if (typeof obj !== "object" || Array.isArray(obj)) {
		out[prefix] = obj;
		return out;
	}
	const keys = Object.keys(obj);
	if (keys.length === 0 && prefix) {
		out[prefix] = obj;
		return out;
	}
	for (const key of keys) {
		const next = prefix ? `${prefix}.${key}` : key;
		const value = obj[key];
		if (value !== null && typeof value === "object" && !Array.isArray(value)) {
			flatten(value, next, out);
		} else {
			out[next] = value;
		}
	}
	return out;
}

function interpolations(value) {
	if (typeof value !== "string") return new Set();
	const matches = value.match(/\{\{\s*([a-zA-Z0-9_]+)[^}]*\}\}/g) ?? [];
	const names = matches.map((m) => {
		const inner = m.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "");
		return inner.split(/[^a-zA-Z0-9_]/)[0];
	});
	return new Set(names.filter(Boolean));
}

function setsEqual(a, b) {
	if (a.size !== b.size) return false;
	for (const v of a) if (!b.has(v)) return false;
	return true;
}

async function readJson(filePath) {
	const raw = await readFile(filePath, "utf-8");
	return JSON.parse(raw);
}

const baselineFiles = (await readdir(path.join(MESSAGES_DIR, BASELINE_LOCALE))).filter(
	(f) => f.endsWith(".json"),
);

let missingCount = 0;
let extraCount = 0;
let mismatchCount = 0;

for (const file of baselineFiles) {
	const baseline = flatten(await readJson(path.join(MESSAGES_DIR, BASELINE_LOCALE, file)));
	const baselineKeys = Object.keys(baseline);

	for (const locale of TARGET_LOCALES) {
		const targetPath = path.join(MESSAGES_DIR, locale, file);
		let targetRaw;
		try {
			targetRaw = await readJson(targetPath);
		} catch {
			console.error(`[missing-file] ${locale}/${file} — file not found`);
			missingCount += baselineKeys.length;
			continue;
		}
		const target = flatten(targetRaw);

		const missing = baselineKeys.filter((k) => !(k in target));
		const extra = Object.keys(target).filter((k) => !(k in baseline));

		if (missing.length > 0) {
			missingCount += missing.length;
			console.error(`[missing] ${locale}/${file} (${missing.length}):`);
			for (const k of missing) console.error(`  - ${k}`);
		}
		if (extra.length > 0) {
			extraCount += extra.length;
			console.warn(`[extra] ${locale}/${file} (${extra.length}):`);
			for (const k of extra) console.warn(`  + ${k}`);
		}

		for (const key of baselineKeys) {
			if (!(key in target)) continue;
			const baseVars = interpolations(baseline[key]);
			const targetVars = interpolations(target[key]);
			if (!setsEqual(baseVars, targetVars)) {
				mismatchCount += 1;
				console.warn(
					`[interpolation] ${locale}/${file} :: ${key} — baseline {{${[...baseVars].join("}}, {{")}}} vs ${locale} {{${[...targetVars].join("}}, {{")}}}`,
				);
			}
		}
	}
}

console.log(
	`\ncheck-translations: ${missingCount} missing, ${extraCount} extra, ${mismatchCount} interpolation mismatches`,
);

if (missingCount > 0) {
	console.error("FAIL: missing translation keys found.");
	process.exit(1);
} else {
	console.log("OK: no missing keys.");
}
