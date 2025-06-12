import { generateDotDistribution, getPolarization } from "$lib/Cell";
import { expect, test } from "vitest";

test("generateDotDistribution 2-state", () => {
	expect(generateDotDistribution([0])).toEqual(new Array(4).fill(0.5));

	expect(generateDotDistribution([1])).toEqual([1, 0, 1, 0]);

	expect(generateDotDistribution([-1])).toEqual([0, 1, 0, 1]);
});

test("generateDotDistribution 3-state", () => {
	expect(generateDotDistribution([0, 0])).toEqual(new Array(8).fill(0.25));
	expect(generateDotDistribution([1, 0])).toEqual([1, 0, 0, 0, 1, 0, 0, 0]);
	expect(generateDotDistribution([-1, 0])).toEqual([0, 0, 1, 0, 0, 0, 1, 0]);
	expect(generateDotDistribution([0, 1])).toEqual([0, 1, 0, 0, 0, 1, 0, 0]);
	expect(generateDotDistribution([0, -1])).toEqual([0, 0, 0, 1, 0, 0, 0, 1]);
});

test("getPolarization 2-state", () => {
	expect(getPolarization([0.5, 0.5, 0.5, 0.5])).toEqual([0]);

	expect(getPolarization([1, 0, 1, 0])).toEqual([1]);

	expect(getPolarization([0, 1, 0, 1])).toEqual([-1]);
});

test("getPolarization 3-state", () => {
	expect(
		getPolarization([0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25]),
	).toEqual([0, 0]);

	expect(getPolarization([1, 0, 0, 0, 1, 0, 0, 0])).toEqual([1, 0]);

	expect(getPolarization([0, 0, 1, 0, 0, 0, 1, 0])).toEqual([-1, 0]);

	expect(getPolarization([0, 1, 0, 0, 0, 1, 0, 0])).toEqual([0, 1]);

	expect(getPolarization([0, 0, 0, 1, 0, 0, 0, 1])).toEqual([0, -1]);
});
