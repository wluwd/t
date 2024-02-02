import { UnknownLocale, formatter } from "@wluwd/t-utils";
import { createDefineTranslationsConfig } from "~/factory.ts";
import { describe, expect, it, vi } from "vitest";

import type { Options } from "~/factory.ts";

const enGB = { some: { deep: { string: "en-GB" } } };
const enUS = { some: { deep: { string: "en-US" } } };

const getMocks = () => {
	const useTranslations = vi.fn();
	const useLocale = vi.fn();
	const setLocale = vi.fn();

	return [
		{
			locale: {
				hook: ["useLocale", vi.fn(() => useLocale)],
				setter: ["setLocale", vi.fn(() => setLocale)],
			},
			resources: { cache: new Map(), loaders: new Map() },
			translations: {
				hook: ["useTranslations", vi.fn(() => useTranslations)],
				loader: vi.fn(() => ({})),
			},
		} satisfies Options,
		{ setLocale, useLocale, useTranslations },
		{
			"en-GB": () => Promise.resolve(enGB),
			"en-US": () => Promise.resolve(enUS),
		},
		{ formatter, localeSource: [] },
	] as const;
};

it("creates a working `createTranslations` function", () => {
	const [factoryOptions, hooks, loaders, instanceOptions] = getMocks();

	const translations = createDefineTranslationsConfig(false, factoryOptions)(
		loaders,
		instanceOptions,
	);

	expect(factoryOptions.resources.loaders).toEqual(
		new Map([
			["en-GB", loaders["en-GB"]],
			["en-US", loaders["en-US"]],
		]),
	);
	expect(factoryOptions.resources.cache).toEqual(new Map());
	expect(factoryOptions.locale.setter[1]).toHaveBeenCalled();
	expect(factoryOptions.translations.hook[1]).toHaveBeenCalledWith(
		factoryOptions.translations.loader,
		{
			cache: factoryOptions.resources.cache,
			loaders: factoryOptions.resources.loaders,
		},
	);
	expect(translations).toEqual({
		setLocale: hooks.setLocale,
		t: formatter,
		useLocale: hooks.useLocale,
		useTranslations: hooks.useTranslations,
	});
});

describe("`defaultLocale`", () => {
	it("calls `locale.setter` when it's a string", () => {
		const [options, { setLocale }, loaders] = getMocks();

		createDefineTranslationsConfig(false, options)(loaders, {
			formatter,
			localeSource: ["en-GB"],
		});

		expect(setLocale).toHaveBeenCalledWith("en-GB");
	});

	it("throws `UnknownDefaultLocale` when using an unknown locale", () => {
		const [options, _, loaders] = getMocks();

		try {
			createDefineTranslationsConfig(false, options)(loaders, {
				// @ts-expect-error unknown locale
				localeSource: ["it-IT"],
			});
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(UnknownLocale);
			expect((error as UnknownLocale).details).toEqual({
				availableLocales: ["en-GB", "en-US"],
				desiredLocale: "it-IT",
				negotiator: "it-IT",
			});
		}
	});
});
