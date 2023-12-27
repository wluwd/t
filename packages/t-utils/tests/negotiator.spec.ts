import { browser } from "~/negotiator.ts";
import { expect, it } from "vitest";

it("`browser` returns expected locale from `navigator.languages`", async () => {
	// @info statically set by happy-dom, should never fail
	expect(navigator.languages).toEqual(["en-US", "en"]);

	expect(browser(["en-US", "en-GB"])).toBe("en-US");
});
