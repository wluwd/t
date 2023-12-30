import { createDefineTranslationsConfig } from "~/factory.ts";
import * as indexImports from "~/index.ts";
import { expect, it } from "vitest";

it("exports `t`, `createTranslationsFactory`, `lazyTranslations`, and the errors", () => {
	expect(indexImports.createDefineTranslationsConfig).toBe(
		createDefineTranslationsConfig,
	);
});
