import { negotiateLanguages } from "@fluent/langneg";
import {
	NoLocaleSet,
	NoTranslationsSet,
	createTranslationsFactory,
} from "@wluwd/t";
import delve from "dlv";
import { atom, getDefaultStore, useAtomValue } from "jotai";
import { useMemo } from "react";

const $locale = atom<string | undefined>(undefined);
const defaultStore = getDefaultStore();

export const createTranslations = createTranslationsFactory({
	getTranslationsHook: {
		factory: ({ cache, lazyLoaders }) => {
			const $translations = atom(async (get) => {
				const locale = get($locale);

				if (locale === undefined) {
					throw new NoLocaleSet();
				}

				let translations = cache.get(locale);

				if (translations !== undefined) {
					return translations;
				}

				const loader = lazyLoaders.get(locale);

				if (loader === undefined) {
					throw new NoTranslationsSet({
						availableLocales: Array.from(lazyLoaders.keys()),
						desiredLocale: locale,
					});
				}

				translations = await loader();

				cache.set(locale, translations);

				return translations;
			});

			return (prefix) => {
				const translations = useAtomValue($translations);

				// eslint-disable-next-line ts/no-unsafe-return
				return useMemo(
					// eslint-disable-next-line ts/no-unsafe-return
					() => delve(translations, prefix),
					[prefix, translations],
				);
			};
		},
		name: "useTranslations",
	},
	locale: {
		getter: {
			factory: () => () => useAtomValue($locale)!,
			name: "useLocale",
		},
		negotiator: (availableLocales, fallback) =>
			negotiateLanguages(navigator.languages, availableLocales, {
				defaultLocale: fallback,
				strategy: "lookup",
			})[0] ?? fallback,
		setter: (locale) => {
			defaultStore.set($locale, locale);
		},
	},
	resources: {
		cache: new Map(),
		lazyLoaders: new Map(),
	},
});

export {
	NoLocaleSet,
	NoTranslationsSet,
	UnknownDefaultLocale,
	UnknownDefaultLocaleStrategy,
	lazyTranslations,
} from "@wluwd/t";
