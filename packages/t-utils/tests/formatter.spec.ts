import { formatter } from "~/formatter.ts";
import { expect, it } from "vitest";

it("swaps `{{placeholder}}` with the `placeholder` property provided", () => {
	expect(formatter("{{placeholder}}", { placeholder: "string" })).toBe(
		"string",
	);
});

it("calls the property's `toString` method", () => {
	expect(
		formatter("{{placeholder}}", {
			// @ts-expect-error types allows only for strings
			placeholder: { toString: () => "string" },
		}),
	).toBe("string");
});

it("doesn't throw when the required property is not set", () => {
	// @ts-expect-error placeholder not provided
	expect(formatter("{{placeholder}}", {})).toBe(
		"[`placeholder` was not provided]",
	);
	// @ts-expect-error entire object not provided
	expect(formatter("{{placeholder}}")).toBe("[`placeholder` was not provided]");
});
