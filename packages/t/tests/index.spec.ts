import { createTranslationsFactory } from "~/factory.ts";
import * as indexImports from "~/index.ts";
import { lazyTranslations } from "~/lazy-loader.ts";
import { t } from "~/translator.ts";
import { expect, it } from "vitest";

it("exports `t`, `createTranslationsFactory`, `lazyTranslations`, and the errors", () => {
	expect(indexImports.t).toBe(t);
	expect(indexImports.createTranslationsFactory).toBe(
		createTranslationsFactory,
	);

	expect(indexImports.lazyTranslations).toBe(lazyTranslations);
});
