import { isKeyof } from "~/utils.ts";
import { describe, expect, it } from "vitest";

describe("`isKeyof`", () => {
	it("should return `true` when `needle` is keyof `haystack`", () => {
		expect(isKeyof({ key: "string" }, "key")).toBe(true);
	});

	it("should return `false` when `needle` is not keyof `haystack`", () => {
		expect(isKeyof({ key: "string" }, "unknown")).toBe(false);
	});
});
