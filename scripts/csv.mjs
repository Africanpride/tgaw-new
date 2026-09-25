/**
 * csv.mjs — minimal RFC 4180 CSV helpers shared by export-translations.mjs and
 * import-translations.mjs so both sides always agree on quoting rules.
 */

/** Escape a single field: quote when it contains comma, quote, CR or LF. */
export function escapeField(value) {
	const s = value == null ? "" : String(value);
	return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Serialize a 2D array to CSV text (LF line endings, trailing newline). */
export function toCsv(rows) {
	return `${rows.map((row) => row.map(escapeField).join(",")).join("\n")}\n`;
}

/**
 * Parse CSV text into a 2D array of strings.
 * Handles quoted fields, doubled quotes, embedded newlines, CRLF and a UTF-8 BOM.
 */
export function parseCsv(text) {
	if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

	const rows = [];
	let row = [];
	let field = "";
	let inQuotes = false;
	let i = 0;

	while (i < text.length) {
		const c = text[i];

		if (inQuotes) {
			if (c === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i += 2;
					continue;
				}
				inQuotes = false;
				i += 1;
				continue;
			}
			field += c;
			i += 1;
			continue;
		}

		if (c === '"') {
			inQuotes = true;
			i += 1;
			continue;
		}
		if (c === ",") {
			row.push(field);
			field = "";
			i += 1;
			continue;
		}
		if (c === "\r" && text[i + 1] === "\n") {
			row.push(field);
			rows.push(row);
			row = [];
			field = "";
			i += 2;
			continue;
		}
		if (c === "\n" || c === "\r") {
			row.push(field);
			rows.push(row);
			row = [];
			field = "";
			i += 1;
			continue;
		}
		field += c;
		i += 1;
	}

	if (field.length > 0 || row.length > 0) {
		row.push(field);
		rows.push(row);
	}

	return rows;
}
