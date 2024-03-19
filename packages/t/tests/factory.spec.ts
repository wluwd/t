import { NoLocaleFound, UnknownLocale, formatter } from "@wluwd/t-utils";
import { defineTranslationsConfigFactory } from "~/factory.ts";
import { describe, expect, it, vi } from "vitest";

import type { Options } from "~/factory.ts";

const enGB = { some: { deep: { string: "en-GB" } } } as const;
const enUS = { some: { deep: { string: "en-US" } } } as const;

const getMocks = () => {
	let locale: string;

	const cache = new Map();
	const loaders = new Map();

	const loader = vi.fn(
		// eslint-disable-next-line ts/no-unsafe-return
		(locale) => (locale && cache.get(locale)) ?? ({} as any),
	);

	// eslint-disable-next-line ts/no-unsafe-return
	const getTranslations = vi.fn(() => loader(locale));
	const useTranslations = vi.fn();
	const useLocale = vi.fn();
	const setLocale = vi.fn((newLocale) => {
		// eslint-disable-next-line ts/no-unsafe-assignment
		locale = newLocale;
	});

	return [
		{
			locale: {
				getter: ["useLocale", vi.fn(() => useLocale)] as const,
				setter: ["setLocale", vi.fn(() => setLocale)],
			},
			resources: { cache, loaders },
			translations: ["useTranslations", vi.fn(() => useTranslations)],
		} as const satisfies Options,
		{ getTranslations, setLocale, useLocale, useTranslations },
		{
			"en-GB": () => Promise.resolve(enGB),
			"en-US": () => Promise.resolve(enUS),
		},
		{ formatter, localeSource: [] },
	] as const;
};

it("creates a working `createTranslations` function", () => {
	const [factoryOptions, hooks, loaders, instanceOptions] = getMocks();

	const translations = defineTranslationsConfigFactory(false, factoryOptions)(
		loaders,
		instanceOptions,
	);

	expect(factoryOptions.resources.loaders).toEqual(
		new Map<any, any>([
			["en-GB", loaders["en-GB"]],
			["en-US", loaders["en-US"]],
		]),
	);
	expect(factoryOptions.resources.cache).toEqual(new Map());
	expect(factoryOptions.locale.getter[1]).toHaveBeenCalledWith({
		atoms: {
			$locale: translations.$locale,
			$translations: translations.$translations,
		},
	});
	expect(factoryOptions.locale.setter[1]).toHaveBeenCalledWith({
		atoms: {
			$locale: translations.$locale,
			$translations: translations.$translations,
		},
	});
	expect(factoryOptions.translations[1]).toHaveBeenCalledWith({
		atoms: {
			$locale: translations.$locale,
			$translations: translations.$translations,
		},
		cache: factoryOptions.resources.cache,
		loaders: factoryOptions.resources.loaders,
	});
	expect(translations).toEqual({
		$locale: translations.$locale,
		$translations: translations.$translations,
		setLocale: hooks.setLocale,
		t: formatter,
		useLocale: hooks.useLocale,
		useTranslations: hooks.useTranslations,
	});
});

it("uses initial cache", async () => {
	const [options, _, loaders] = getMocks();

	const enUSCached = { some: { deep: { string: "cached!" } } } as const;

	const { $translations } = defineTranslationsConfigFactory(false, options)(
		loaders,
		{
			cache: {
				// @ts-expect-error translations don't match
				"en-US": enUSCached,
			},
			formatter,
			localeSource: ["en-US"],
		},
	);

	expect(await $translations.get()).toBe(enUSCached);
});

it("can be lazy initialized", async () => {
	const [options, _, loaders] = getMocks();

	const { $locale, init } = defineTranslationsConfigFactory(false, options)(
		loaders,
		{
			formatter,
			localeSource: ["en-US"],
		},
		true,
	);

	expect($locale.get()).toBe(undefined);

	init(["en-GB"]);

	expect($locale.get()).toBe("en-GB");
});

describe("`defaultLocale`", () => {
	it("sets the locale when it's a string", () => {
		const [options, _, loaders] = getMocks();

		const { $locale } = defineTranslationsConfigFactory(false, options)(
			loaders,
			{
				formatter,
				localeSource: ["en-GB"],
			},
		);

		expect($locale.get()).toBe("en-GB");
	});

	it("skips `false` in negotiators", async () => {
		const [options, _, loaders] = getMocks();

		const { $locale } = defineTranslationsConfigFactory(false, options)(
			loaders,
			{
				formatter,
				localeSource: [false, "en-GB"],
			},
		);

		expect($locale.get()).toBe("en-GB");
	});

	it("throws `UnknownDefaultLocale` when using an unknown locale", () => {
		const [options, _, loaders] = getMocks();

		try {
			defineTranslationsConfigFactory(false, options)(loaders, {
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

	it("throws `NoLocaleFound` when all negotiators fail to find a locale", () => {
		const [options, _, loaders] = getMocks();
		const negotiators = [() => undefined];

		try {
			defineTranslationsConfigFactory(false, options)(loaders, {
				formatter,
				// @ts-expect-error no fallback locale
				localeSource: negotiators,
			});
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(NoLocaleFound);
			expect((error as NoLocaleFound).details).toEqual({
				availableLocales: ["en-GB", "en-US"],
				negotiators,
			});
		}
	});
});
