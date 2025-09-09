export interface CustomOption {
	type: string;
	id: string;
}

export interface HeaderOption extends CustomOption {
	type: "header";
	label: string;
}

export interface BreakOption extends CustomOption {
	type: "break";
}

export type InputOptionType =
	| "number"
	| "string"
	| "select"
	| "slider"
	| "boolean";

export interface InputOptionBase extends CustomOption {
	type: "input";
	name: string;
	description?: string;
	required?: boolean;
	descriptor: {
		type: InputOptionType;
	};
}

export interface NumberInputOption extends InputOptionBase {
	descriptor: {
		type: "number";
		min?: number;
		max?: number;
		whole_num?: boolean;
		unit?: string;
		default: number;
	};
}

export interface StringInputOption extends InputOptionBase {
	descriptor: {
		type: "string";
		placeholder?: string;
		maxLength?: number;
		pattern?: string;
		default: string;
	};
}

export interface SelectInputOption extends InputOptionBase {
	descriptor: {
		type: "select";
		options: Array<{
			label: string;
			value: string | number;
		}>;
		default: string | number;
		allowMultiple?: boolean;
	};
}

export interface SliderInputOption extends InputOptionBase {
	descriptor: {
		type: "slider";
		min: number;
		max: number;
		step?: number;
		default: number;
		unit?: string;
	};
}

export interface BooleanInputOption extends InputOptionBase {
	descriptor: {
		type: "boolean";
		default: boolean;
	};
}

export function createBooleanInput(
	id: string,
	label: string,
	defaultValue: boolean,
): BooleanInputOption {
	return {
		type: "input",
		id,
		name: label,
		descriptor: {
			type: "boolean",
			default: defaultValue,
		},
	};
}

export function createSliderInput(
	id: string,
	label: string,
	min: number,
	max: number,
	defaultValue: number,
	step?: number,
	unit?: string,
): SliderInputOption {
	return {
		type: "input",
		id,
		name: label,
		descriptor: {
			type: "slider",
			min,
			max,
			step,
			default: defaultValue,
			unit,
		},
	};
}

export type Option =
	| HeaderOption
	| BreakOption
	| NumberInputOption
	| StringInputOption
	| SelectInputOption
	| SliderInputOption
	| BooleanInputOption;
export type OptionsList = Array<Option>;
export type OptionValue =
	| string
	| number
	| boolean
	| Array<string | number | boolean>
	| null;
export type OptionValuesMap = Map<string, OptionValue>;
