import {
	NoLocaleFound,
	NoLocaleSet,
	NoTranslationsSet,
	UnknownLocale,
	isLocaleError,
} from "~/error.ts";
import { expect, it } from "vitest";

it("`isLocaleError` recognized `NoLocaleFound`", async () => {
	expect(
		isLocaleError(
			new NoLocaleFound({
				availableLocales: [],
				negotiators: [],
			}),
		),
	).toBe(true);
});

it("`isLocaleError` recognized `NoLocaleSet`", async () => {
	expect(isLocaleError(new NoLocaleSet())).toBe(true);
});

it("`isLocaleError` recognized `NoTranslationsSet`", async () => {
	expect(
		isLocaleError(
			new NoTranslationsSet({
				availableLocales: [],
				desiredLocale: "",
			}),
		),
	).toBe(true);
});

it("`isLocaleError` recognized `UnknownLocale`", async () => {
	expect(
		isLocaleError(
			new UnknownLocale({
				availableLocales: [],
				desiredLocale: "",
				negotiator: false,
			}),
		),
	).toBe(true);
});
