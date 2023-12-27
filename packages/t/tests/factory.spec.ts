import { UnknownLocale, translator } from "@wluwd/t-utils";
import { createTranslationsFactory } from "~/factory.ts";
import { describe, expect, it, vi } from "vitest";

import type { CreateTranslationsFactoryOptions } from "~/factory.ts";

const enGB = { some: { deep: { string: "en-GB" } } };
const enUS = { some: { deep: { string: "en-US" } } };

const getMocks = () => {
	const useTranslations = vi.fn();
	const useLocale = vi.fn();

	return [
		{
			hasSignalLikeInterface: false,
			locale: {
				hook: {
					factory: vi.fn(() => useLocale),
					name: "useLocale",
				},
				setter: vi.fn(),
			},
			resources: { cache: new Map(), loaders: new Map() },
			translations: {
				hook: {
					factory: vi.fn(() => useTranslations),
					name: "useTranslations",
				},
			},
		} satisfies CreateTranslationsFactoryOptions<
			false,
			undefined,
			"useLocale",
			undefined,
			"useTranslations"
		>,
		{ useLocale, useTranslations },
		{
			"en-GB": () => Promise.resolve(enGB),
			"en-US": () => Promise.resolve(enUS),
		},
		{ localeFrom: [], translator },
	] as const;
};

it("creates a working `createTranslations` function", () => {
	const [factoryOptions, hooks, loaders, instanceOptions] = getMocks();

	const translations = createTranslationsFactory(factoryOptions)(
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
	expect(factoryOptions.locale.setter).not.toHaveBeenCalled();
	expect(factoryOptions.translations.hook.factory).toHaveBeenCalledWith({
		cache: factoryOptions.resources.cache,
		loaders: factoryOptions.resources.loaders,
	});
	expect(translations).toEqual({
		setLocale: factoryOptions.locale.setter,
		t: translator,
		useLocale: hooks.useLocale,
		useTranslations: hooks.useTranslations,
	});
});

describe("`defaultLocale`", () => {
	it("calls `locale.setter` when it's a string", () => {
		const [options, _, loaders] = getMocks();

		createTranslationsFactory(options)(loaders, {
			localeFrom: ["en-GB"],
			translator,
		});

		expect(options.locale.setter).toHaveBeenCalledWith("en-GB");
	});

	it("throws `UnknownDefaultLocale` when using an unknown locale", () => {
		const [options, _, loaders] = getMocks();

		try {
			// @ts-expect-error unknown locale
			createTranslationsFactory(options)(loaders, { localeFrom: ["it-IT"] });
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
