#!/usr/bin/env node
/**
 * export-translations.mjs — export i18n keys to CSV for human translators.
 * Re-import the filled CSV later with import-translations.mjs.
 *
 * Columns:
 *   file          messages/en/<file> the key belongs to (e.g. admin)
 *   key           flat dot-separated key (e.g. board.stats.title)
 *   en            baseline English source string (context for the translator)
 *   translation   existing translation, or empty when missing — translator fills this
 *   notes         optional free-text notes (left blank for the translator to use)
 *
 * Usage:
 *   node scripts/export-translations.mjs [--locale fr] [--only-missing] [--ns admin,common] [-o out.csv]
 *   bun run i18n:export                     # all locales → translations-fr/es/pt.csv
 *   bun run i18n:export --locale fr --only-missing
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { toCsv } from "./csv.mjs";

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

async function readJson(filePath) {
	return JSON.parse(await readFile(filePath, "utf-8"));
}

const { values } = parseArgs({
	options: {
		locale: { type: "string" },
		"only-missing": { type: "boolean", default: false },
		ns: { type: "string" },
		out: { type: "string", short: "o" },
		help: { type: "boolean", short: "h", default: false },
	},
});

if (values.help) {
	console.log(
		"Usage: node scripts/export-translations.mjs [--locale <fr|es|pt>] [--only-missing] [--ns admin,common] [-o file.csv]\n" +
			"Without --locale, exports every target locale to its own translations-<locale>.csv.",
	);
	process.exit(0);
}

// No --locale → export all target locales; -o only makes sense for a single one
const locales = values.locale ? [values.locale] : TARGET_LOCALES;
for (const locale of locales) {
	if (!TARGET_LOCALES.includes(locale)) {
		console.error(`Invalid locale "${locale}" — expected one of: ${TARGET_LOCALES.join(", ")}`);
		process.exit(1);
	}
}
if (values.out && locales.length > 1) {
	console.error("-o/--out requires a single --locale (multiple locales write their own files).");
	process.exit(1);
}

const allFiles = (await readdir(path.join(MESSAGES_DIR, BASELINE_LOCALE)))
	.filter((f) => f.endsWith(".json"))
	.sort();

let files = allFiles;
if (values.ns) {
	const wanted = values.ns.split(",").map((s) => s.trim()).filter(Boolean);
	files = wanted.map((ns) => (ns.endsWith(".json") ? ns : `${ns}.json`));
	const unknown = files.filter((f) => !allFiles.includes(f));
	if (unknown.length > 0) {
		console.error(`Unknown namespace file(s): ${unknown.join(", ")}`);
		console.error(`Available: ${allFiles.join(", ")}`);
		process.exit(1);
	}
}

for (const locale of locales) {
	const rows = [["file", "key", "en", "translation", "notes"]];
	let missingCount = 0;

	for (const file of files) {
		const baseline = flatten(await readJson(path.join(MESSAGES_DIR, BASELINE_LOCALE, file)));

		let target = {};
		try {
			target = flatten(await readJson(path.join(MESSAGES_DIR, locale, file)));
		} catch {
			// locale file not yet created — every key exports as missing
		}

		for (const key of Object.keys(baseline)) {
			const translation = key in target ? String(target[key]) : "";
			const isMissing = !(key in target);
			if (isMissing) missingCount += 1;
			if (values["only-missing"] && !isMissing) continue;
			rows.push([file.replace(/\.json$/, ""), key, String(baseline[key]), translation, ""]);
		}
	}

	const outPath = values.out ?? `translations-${locale}.csv`;
	// UTF-8 BOM so Excel on Windows detects accents correctly
	await writeFile(outPath, `\uFEFF${toCsv(rows)}`, "utf-8");

	console.log(
		`export-translations: wrote ${rows.length - 1} rows from ${files.length} file(s) to ${outPath}` +
			(values["only-missing"] ? ` (${missingCount} keys missing for "${locale}" overall)` : ""),
	);
}

if (locales.length === 1) {
	console.log(`Send it to the translator; re-import with: bun run i18n:import --locale ${locales[0]}`);
} else {
	console.log(
		`Send the files to the translator; re-import each with: bun run i18n:import --locale <${locales.join("|")}>`,
	);
}
