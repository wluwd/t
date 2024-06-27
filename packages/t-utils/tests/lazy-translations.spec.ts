import { expect, it } from "vitest";
import { lazyTranslations } from "~/lazy-translations.ts";

const fakeDefaultImport = {
	default: {
		an: "object",
	},
} as const;

it("returns a function that resolves to an object's `default` property", async () => {
	expect(
		await lazyTranslations(() => Promise.resolve(fakeDefaultImport))(),
	).toBe(fakeDefaultImport.default);
});
