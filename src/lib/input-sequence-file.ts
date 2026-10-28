/**
 * Custom input sequences as CSV: a header row of input labels, then one vector
 * of state letters (A-D) per row. Reading also accepts indices 0-3, lower case,
 * `;`/tab/space separators and `#` comments; the header is optional.
 */

export const INPUT_SEQUENCE_FILE_EXTENSIONS = ["csv", "txt"];

export const STATE_LETTERS = ["A", "B", "C", "D"];

export interface InputSequenceColumn {
	label: string;
	/** 2 or 4. */
	numStates: number;
}

export function serializeInputSequence(
	inputs: InputSequenceColumn[],
	sequence: number[][],
): string {
	const lines = [inputs.map((input) => csvField(input.label)).join(",")];
	for (const vector of sequence) {
		lines.push(
			inputs.map((_, i) => STATE_LETTERS[vector[i] ?? 0]).join(","),
		);
	}
	return lines.join("\n") + "\n";
}

/** Quotes labels that could be read as a state, so the header isn't taken for a vector. */
function csvField(value: string): string {
	return /[",;\s]/.test(value) || parseState(value) !== undefined
		? `"${value.replace(/"/g, '""')}"`
		: value;
}

function splitLine(line: string): string[] {
	const unquoted = line.replace(/"[^"]*"/g, "");
	const byWhitespace = !/[,;\t]/.test(unquoted);
	const delimiter = byWhitespace ? /\s/ : /[,;\t]/;
	const fields: string[] = [];
	let current = "";
	let quoted = false;
	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (quoted) {
			if (char === '"' && line[i + 1] === '"') {
				current += '"';
				i++;
			} else if (char === '"') {
				quoted = false;
			} else {
				current += char;
			}
		} else if (char === '"') {
			quoted = true;
		} else if (delimiter.test(char)) {
			fields.push(current.trim());
			current = "";
		} else {
			current += char;
		}
	}
	fields.push(current.trim());
	return byWhitespace ? fields.filter((f) => f !== "") : fields;
}

function parseState(value: string): number | undefined {
	const letter = STATE_LETTERS.indexOf(value.toUpperCase());
	if (letter >= 0) return letter;
	if (/^\d+$/.test(value)) return parseInt(value);
	return undefined;
}

/** Throws an Error with a user-facing message if the file doesn't fit the inputs. */
export function parseInputSequence(
	content: string,
	inputs: InputSequenceColumn[],
): number[][] {
	if (inputs.length === 0) throw new Error("The design has no input cells.");

	const rows = content
		.split(/\r?\n/)
		.map((line, index) => ({ line: line.trim(), number: index + 1 }))
		.filter(({ line }) => line !== "" && !line.startsWith("#"))
		.map(({ line, number }) => ({
			fields: splitLine(line),
			quoted: line.includes('"'),
			number,
		}));

	// Column i of the file feeds input columnToInput[i].
	let columnToInput = inputs.map((_, i) => i);
	const labels = inputs.map((input) => input.label);
	if (rows.length > 0) {
		const header = rows[0].fields;
		const isHeader =
			header.length === inputs.length &&
			header.every((field) => labels.includes(field)) &&
			new Set(header).size === header.length &&
			// Vectors are never quoted, so a quoted row is a header.
			(rows[0].quoted ||
				!header.every((field) => parseState(field) !== undefined));
		if (isHeader) {
			columnToInput = header.map((field) => labels.indexOf(field));
			rows.shift();
		} else if (header.some((field) => parseState(field) === undefined)) {
			throw new Error(
				`Line ${rows[0].number}: the header must list the input cells (${labels.join(", ")}).`,
			);
		}
	}

	if (rows.length === 0)
		throw new Error("The file contains no input vectors.");

	return rows.map(({ fields, number }) => {
		if (fields.length !== inputs.length) {
			throw new Error(
				`Line ${number}: expected ${inputs.length} value(s), one per input (${labels.join(", ")}), found ${fields.length}.`,
			);
		}
		const vector = new Array<number>(inputs.length);
		fields.forEach((field, column) => {
			const input = columnToInput[column];
			const state = parseState(field);
			if (state === undefined || state >= inputs[input].numStates) {
				const allowed = STATE_LETTERS.slice(
					0,
					inputs[input].numStates,
				).join("/");
				throw new Error(
					`Line ${number}: "${field}" is not a valid state for input ${inputs[input].label} (use ${allowed}).`,
				);
			}
			vector[input] = state;
		});
		return vector;
	});
}
