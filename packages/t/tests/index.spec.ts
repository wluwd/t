import {
	UnknownDefaultLocale,
	UnknownDefaultLocaleStrategy,
	createTranslationsFactory,
} from "~/factory.ts";
import * as indexImports from "~/index.ts";
import { t } from "~/translator.ts";
import { expect, it } from "vitest";

it("exports `t`, `createTranslationsFactory`, and the errors", () => {
	expect(indexImports.t).toBe(t);
	expect(indexImports.createTranslationsFactory).toBe(
		createTranslationsFactory,
	);
	expect(indexImports.UnknownDefaultLocale).toBe(UnknownDefaultLocale);
	expect(indexImports.UnknownDefaultLocaleStrategy).toBe(
		UnknownDefaultLocaleStrategy,
	);
});
