import {
	UnknownDefaultLocale,
	UnknownDefaultLocaleStrategy,
	createTranslationsFactory,
} from "~/factory.ts";
import { t } from "~/translator.ts";
import { describe, expect, it, vi } from "vitest";

import type { CreateTranslationsFactoryOptions } from "~/factory.ts";

const enGB = { some: { deep: { string: "en-GB" } } };
const enUS = { some: { deep: { string: "en-US" } } };

const getMocks = () => {
	const useTranslations = vi.fn();
	const useLocale = vi.fn();

	return [
		{
			getTranslationsHook: {
				factory: vi.fn(() => useTranslations),
				name: "useTranslations",
			},
			locale: {
				getter: {
					factory: vi.fn(() => useLocale),
					name: "useLocale",
				},
				negotiator: vi.fn((_: string[], fallback: string) => fallback),
				setter: vi.fn(),
			},
			resources: { cache: new Map(), lazyLoaders: new Map() },
		} satisfies CreateTranslationsFactoryOptions<
			"useTranslations",
			"useLocale"
		>,
		{ useLocale, useTranslations },
		{
			"en-GB": () => Promise.resolve(enGB),
			"en-US": () => Promise.resolve(enUS),
		},
	] as const;
};

it("creates a working `createTranslations` function", () => {
	const [options, hooks, loaders] = getMocks();

	const translations = createTranslationsFactory(options)(loaders);

	expect(options.resources.lazyLoaders).toEqual(
		new Map([
			["en-GB", loaders["en-GB"]],
			["en-US", loaders["en-US"]],
		]),
	);
	expect(options.resources.cache).toEqual(new Map());
	expect(options.locale.setter).not.toHaveBeenCalled();
	expect(options.getTranslationsHook.factory).toHaveBeenCalledWith({
		cache: options.resources.cache,
		lazyLoaders: options.resources.lazyLoaders,
	});
	expect(translations).toEqual({
		setLocale: options.locale.setter,
		t,
		useLocale: hooks.useLocale,
		useTranslations: hooks.useTranslations,
	});
});

describe("`defaultLocale`", () => {
	it("calls `locale.setter` when it's a string", () => {
		const [options, _, loaders] = getMocks();

		createTranslationsFactory(options)(loaders, "en-GB");

		expect(options.locale.setter).toHaveBeenCalledWith("en-GB");
	});

	it("calls `negotiator` when it's an array", () => {
		const [options, _, loaders] = getMocks();

		createTranslationsFactory(options)(loaders, ["auto", "en-US"]);

		expect(options.locale.negotiator).toHaveBeenCalledWith(
			["en-GB", "en-US"],
			"en-US",
		);
		expect(options.locale.negotiator).toHaveReturnedWith("en-US");
		expect(options.locale.setter).toHaveBeenCalledWith("en-US");
	});

	it("throws `UnknownDefaultLocale` when using an unknown locale", () => {
		const [options, _, loaders] = getMocks();

		try {
			// @ts-expect-error unknown locale
			createTranslationsFactory(options)(loaders, "it-IT");
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(UnknownDefaultLocale);
			expect((error as UnknownDefaultLocale).details).toEqual({
				availableLocales: ["en-GB", "en-US"],
				desiredLocale: "it-IT",
			});
		}
	});

	it("throws `UnknownDefaultLocaleStrategy` when using an unknown strategy", () => {
		const [options, _, loaders] = getMocks();

		const createTranslations = createTranslationsFactory(options);

		try {
			// @ts-expect-error locale not provided
			createTranslations(loaders, ["auto", "it-IT"]);
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(UnknownDefaultLocaleStrategy);
			expect((error as UnknownDefaultLocaleStrategy).details).toEqual({
				availableLocales: ["en-GB", "en-US"],
				availableStrategies: ["auto"],
				desiredFallback: "it-IT",
				desiredStrategy: "auto",
			});
		}

		// @ts-expect-error locale not provided
		expect(() => createTranslations(loaders, ["unknown", "en-US"])).toThrow(
			UnknownDefaultLocaleStrategy,
		);
	});
});
