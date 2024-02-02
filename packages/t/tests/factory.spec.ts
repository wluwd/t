import { NoLocaleFound, UnknownLocale, formatter } from "@wluwd/t-utils";
import { createDefineTranslationsConfig } from "~/factory.ts";
import { describe, expect, it, vi } from "vitest";

import type { Options } from "~/factory.ts";

const enGB = { some: { deep: { string: "en-GB" } } };
const enUS = { some: { deep: { string: "en-US" } } };

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
				hook: ["useLocale", vi.fn(() => useLocale)],
				setter: ["setLocale", vi.fn(() => setLocale)],
			},
			resources: { cache, loaders },
			translations: {
				fn: ["getTranslations", vi.fn(() => getTranslations)],
				hook: ["useTranslations", vi.fn(() => useTranslations)],
				loader,
			},
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
		getTranslations: hooks.getTranslations,
		setLocale: hooks.setLocale,
		t: formatter,
		useLocale: hooks.useLocale,
		useTranslations: hooks.useTranslations,
	});
});

it("uses initial cache", async () => {
	const [options, _, loaders] = getMocks();

	const enUSCached = { some: { deep: { string: "cached!" } } } as const;

	const { getTranslations } = createDefineTranslationsConfig(false, options)(
		loaders,
		{
			cache: {
				"en-US": enUSCached,
			},
			formatter,
			localeSource: ["en-US"],
		},
	);

	expect(await getTranslations("some")).toBe(enUSCached);
});

it("can be lazy initialized", async () => {
	const [options, hooks, loaders] = getMocks();

	const { init } = createDefineTranslationsConfig(false, options)(
		loaders,
		{
			formatter,
			localeSource: ["en-US"],
		},
		true,
	);

	expect(hooks.setLocale).toHaveBeenCalledTimes(0);

	init(["en-GB"]);

	expect(hooks.setLocale).toHaveBeenLastCalledWith("en-GB");
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

	it("throws `NoLocaleFound` when all negotiators fail to find a locale", () => {
		const [options, _, loaders] = getMocks();
		const negotiators = [() => undefined];

		try {
			createDefineTranslationsConfig(false, options)(loaders, {
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
