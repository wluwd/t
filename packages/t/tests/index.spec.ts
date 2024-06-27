import { expect, it } from "vitest";
import { createDefineTranslationsConfig } from "~/factory.ts";
import * as indexImports from "~/index.ts";

it("exports `t`, `createTranslationsFactory`, `lazyTranslations`, and the errors", () => {
	expect(indexImports.createDefineTranslationsConfig).toBe(
		createDefineTranslationsConfig,
	);
});
