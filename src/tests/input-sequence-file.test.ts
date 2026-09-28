import { expect, test } from "vitest";
import {
	parseInputSequence,
	serializeInputSequence,
} from "$lib/input-sequence-file";

const inputs = [
	{ label: "In", numStates: 4 },
	{ label: "X", numStates: 4 },
	{ label: "Flip Flop", numStates: 4 },
];

test("round trip", () => {
	const sequence = [
		[0, 1, 2],
		[3, 3, 0],
		[0, 1, 2],
	];
	const content = serializeInputSequence(inputs, sequence);
	expect(content).toBe('In,X,"Flip Flop"\nA,B,C\nD,D,A\nA,B,C\n');
	expect(parseInputSequence(content, inputs)).toEqual(sequence);
});

test("header columns are matched by label", () => {
	const content = 'X;"Flip Flop";In\nB;C;A\n';
	expect(parseInputSequence(content, inputs)).toEqual([[0, 1, 2]]);
});

test("lenient values, separators, comments and no header", () => {
	const content = "# my sequence\n\n0 1 2\na\tb\td\n  C , c , 3  \n";
	expect(parseInputSequence(content, inputs)).toEqual([
		[0, 1, 2],
		[0, 1, 3],
		[2, 2, 3],
	]);
});

test("labels that look like states are still read as data without a match", () => {
	const twoInputs = [
		{ label: "A", numStates: 2 },
		{ label: "B", numStates: 2 },
	];
	expect(parseInputSequence("B,A\nA,B\n", twoInputs)).toEqual([
		[1, 0],
		[0, 1],
	]);
});

test("errors name the line and the problem", () => {
	expect(() => parseInputSequence("A,B\n", inputs)).toThrow(
		/Line 1: expected 3 value/,
	);
	expect(() =>
		parseInputSequence("In,X,Y\n", inputs),
	).toThrow(/header must list the input cells/);
	expect(() =>
		parseInputSequence("In,X,Flip Flop\nA,B,E\n", inputs),
	).toThrow(/Line 2: "E" is not a valid state for input Flip Flop/);
	expect(() =>
		parseInputSequence("C\n", [{ label: "In", numStates: 2 }]),
	).toThrow(/use A\/B/);
	expect(() => parseInputSequence("# only a comment\n", inputs)).toThrow(
		/no input vectors/,
	);
});
