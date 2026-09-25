#!/usr/bin/env node
/**
 * import-translations.mjs — merge a translator's CSV back into messages/<locale>/*.json,
 * then validate with check-translations.mjs.
 *
 * Reads columns: file, key, translation (en/notes are informational and ignored).
 *  - Rows with an empty translation are skipped (existing value or missing state kept).
 *  - Existing keys are updated in place; keys missing from the locale file are inserted
 *    in baseline (en) order, so structure can never drift from messages/en.
 *  - Runs scripts/check-translations.mjs afterwards; its exit code is propagated.
 *
 * Usage:
 *   node scripts/import-translations.mjs --locale fr [-i translations-fr.csv]
 *   bun run i18n:import --locale fr
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { parseCsv } from "./csv.mjs";

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
	for (const key of Object.keys(obj)) {
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

/** Set an existing key (flat key first, then nested path). Returns false when absent. */
function setKey(obj, key, value) {
	if (Object.prototype.hasOwnProperty.call(obj, key)) {
		obj[key] = value;
		return true;
	}
	const parts = key.split(".");
	let cur = obj;
	for (let i = 0; i < parts.length - 1; i += 1) {
		const next = cur[parts[i]];
		if (next === null || typeof next !== "object" || Array.isArray(next)) return false;
		cur = next;
	}
	const last = parts[parts.length - 1];
	if (!Object.prototype.hasOwnProperty.call(cur, last)) return false;
	cur[last] = value;
	return true;
}

/**
 * Rebuild the locale file from the baseline (en) structure so new keys land in
 * canonical order. Value precedence: CSV translation → existing locale value → omit
 * (stays missing so i18n:check keeps flagging it).
 */
function rebuild(enObj, existingFlat, csvValues, prefix = "") {
	const out = {};
	for (const key of Object.keys(enObj)) {
		const full = prefix ? `${prefix}.${key}` : key;
		const value = enObj[key];
		if (value !== null && typeof value === "object" && !Array.isArray(value)) {
			const child = rebuild(value, existingFlat, csvValues, full);
			if (Object.keys(child).length > 0) out[key] = child;
			continue;
		}
		const next = csvValues.has(full)
			? csvValues.get(full)
			: full in existingFlat
				? existingFlat[full]
				: undefined;
		if (next !== undefined) out[key] = next;
	}
	return out;
}

const { values } = parseArgs({
	options: {
		locale: { type: "string" },
		in: { type: "string", short: "i" },
		help: { type: "boolean", short: "h", default: false },
	},
});

if (values.help || !values.locale) {
	console.log("Usage: node scripts/import-translations.mjs --locale <fr|es|pt> [-i file.csv]");
	process.exit(values.help ? 0 : 1);
}

const locale = values.locale;
if (!TARGET_LOCALES.includes(locale)) {
	console.error(`Invalid locale "${locale}" — expected one of: ${TARGET_LOCALES.join(", ")}`);
	process.exit(1);
}

const inPath = values.in ?? `translations-${locale}.csv`;

let csvText;
try {
	csvText = await readFile(inPath, "utf-8");
} catch {
	console.error(`CSV not found: ${inPath}`);
	console.error(`Export one first: bun run i18n:export --locale ${locale}`);
	process.exit(1);
}

const table = parseCsv(csvText);
if (table.length === 0) {
	console.error(`CSV is empty: ${inPath}`);
	process.exit(1);
}

const header = table[0].map((h) => h.trim().toLowerCase());
const colFile = header.indexOf("file");
const colKey = header.indexOf("key");
// Accept common aliases — translators often re-save sheets as value/fr/translated
const colTranslation = ["translation", "value", "translated", locale]
	.map((name) => header.indexOf(name))
	.find((i) => i >= 0) ?? -1;
if (colFile < 0 || colKey < 0 || colTranslation < 0) {
	console.error(
		`CSV header must contain file, key and a translation column ` +
			`(translation|value|translated|${locale}) — got: ${table[0].join(",")}`,
	);
	process.exit(1);
}

const validFiles = new Set(
	(await readdir(path.join(MESSAGES_DIR, BASELINE_LOCALE))).filter((f) => f.endsWith(".json")),
);

function interpolationVars(str) {
	return new Set([...String(str).matchAll(/{{\s*([^}]+?)\s*}}/g)].map((m) => m[1]));
}

function sameVars(a, b) {
	const x = interpolationVars(a);
	const y = interpolationVars(b);
	return x.size === y.size && [...x].every((v) => y.has(v));
}

/** @type {Map<string, Map<string, string>>} file → (key → translation) */
const byFile = new Map();
let skippedEmpty = 0;
let unknownKey = 0;
let unknownFile = 0;

for (const row of table.slice(1)) {
	const fileRaw = (row[colFile] ?? "").trim();
	const key = (row[colKey] ?? "").trim();
	const rawTranslation = row[colTranslation] ?? "";
	// Only whitespace-only cells count as empty; otherwise keep the raw value
	// (leading/trailing spaces may be intentional, e.g. " : UE/EEE...")
	const translation = rawTranslation.trim() === "" ? "" : rawTranslation;
	if (!fileRaw && !key) continue;

	const file = fileRaw.endsWith(".json") ? fileRaw : `${fileRaw}.json`;
	if (!validFiles.has(file)) {
		console.warn(`[skip] unknown file "${fileRaw}" (row for key "${key}")`);
		unknownFile += 1;
		continue;
	}
	if (!key) {
		console.warn(`[skip] empty key in file "${file}"`);
		unknownKey += 1;
		continue;
	}
	if (!translation) {
		skippedEmpty += 1;
		continue;
	}
	if (!byFile.has(file)) byFile.set(file, new Map());
	byFile.get(file).set(key, translation);
}

let updated = 0;
let added = 0;
let wroteFiles = 0;
let interpolationErrors = 0;

for (const [file, csvValues] of byFile) {
	const baseline = flatten(await readJsonFile(path.join(MESSAGES_DIR, BASELINE_LOCALE, file)));

	for (const key of [...csvValues.keys()]) {
		if (!(key in baseline)) {
			console.warn(`[skip] ${file} :: ${key} — not present in en baseline`);
			csvValues.delete(key);
			unknownKey += 1;
			continue;
		}
		// Guard the {{var}} placeholders — a broken one would crash the UI at runtime
		if (!sameVars(baseline[key], csvValues.get(key))) {
			console.error(
				`[interpolation] ${file} :: ${key} — en {{${[...interpolationVars(baseline[key])].join("}}, {{")}}} vs translation {{${[...interpolationVars(csvValues.get(key))].join("}}, {{")}}} — cell rejected`,
			);
			csvValues.delete(key);
			interpolationErrors += 1;
		}
	}
	if (csvValues.size === 0) continue;

	let localeObj = {};
	try {
		localeObj = await readJsonFile(path.join(MESSAGES_DIR, locale, file));
	} catch {
		// locale file not created yet — rebuild creates it
	}
	const localeFlat = flatten(localeObj);

	let fileHasAdditions = false;
	for (const key of csvValues.keys()) {
		if (!(key in localeFlat)) fileHasAdditions = true;
	}

	let nextObj;
	if (fileHasAdditions) {
		nextObj = rebuild(await readJsonFile(path.join(MESSAGES_DIR, BASELINE_LOCALE, file)), localeFlat, csvValues);
		for (const key of csvValues.keys()) {
			if (!(key in localeFlat)) added += 1;
			else updated += 1;
		}
	} else {
		nextObj = localeObj;
		for (const [key, value] of csvValues) {
			if (!setKey(nextObj, key, value)) {
				console.warn(`[skip] ${file} :: ${key} — could not locate key in file structure`);
				unknownKey += 1;
				continue;
			}
			updated += 1;
		}
	}

	await writeFile(
		path.join(MESSAGES_DIR, locale, file),
		`${JSON.stringify(nextObj, null, 2)}\n`,
		"utf-8",
	);
	wroteFiles += 1;
}

console.log(
	`import-translations: ${updated} updated, ${added} added, ${skippedEmpty} empty skipped` +
		(interpolationErrors ? `, ${interpolationErrors} interpolation mismatch rejected` : "") +
		(unknownKey ? `, ${unknownKey} unknown skipped` : "") +
		(unknownFile ? `, ${unknownFile} unknown file rows skipped` : "") +
		` → ${wroteFiles} file(s) written for "${locale}"`,
);

if (interpolationErrors > 0) {
	console.error("FAIL: fix the {{variable}} placeholders above and re-import those cells.");
}

if (wroteFiles === 0 && interpolationErrors === 0 && skippedEmpty > 0) {
	console.log("Nothing to import — all translation cells were empty.");
	process.exit(0);
}

console.log("\nValidating with check-translations...");
const check = spawnSync(process.execPath, [path.join(__dirname, "check-translations.mjs")], {
	stdio: "inherit",
});
if (check.status !== 0) process.exit(check.status);
process.exit(interpolationErrors > 0 ? 1 : 0);

async function readJsonFile(filePath) {
	return JSON.parse(await readFile(filePath, "utf-8"));
}
