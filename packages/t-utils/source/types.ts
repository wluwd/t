/**
 * Given an object with [string literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types) as values, deeply converts them to `string`.
 */
export type StringLiteralToStringDeep<T extends object> = {
	[key in keyof T]: T[key] extends object
		? StringLiteralToStringDeep<T[key]>
		: string;
};
