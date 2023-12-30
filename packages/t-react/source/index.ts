import { createDefineTranslationsConfig } from "@wluwd/t";
import { NoLocaleSet, NoTranslationsSet } from "@wluwd/t-utils";
import delve from "dlv";
import { atom, getDefaultStore, useAtomValue } from "jotai";
import { useMemo } from "react";

import type { CreateDefineTranslationsConfigOptions } from "@wluwd/t";

const $locale = atom<string | undefined>(undefined);
const defaultStore = getDefaultStore();

const loadAndCacheTranslations = async (
	locale: string | undefined,
	{
		cache,
		loaders,
	}: CreateDefineTranslationsConfigOptions<
		boolean,
		string,
		string,
		string,
		string
	>["resources"],
) => {
	if (locale === undefined) {
		throw new NoLocaleSet();
	}

	let translations = cache.get(locale);

	if (translations !== undefined) {
		return translations;
	}

	const loader = loaders.get(locale);

	if (loader === undefined) {
		throw new NoTranslationsSet({
			availableLocales: Array.from(loaders.keys()),
			desiredLocale: locale,
		});
	}

	translations = await loader();

	cache.set(locale, translations);

	return translations;
};

export const createTranslations = createDefineTranslationsConfig({
	hasSignalLikeInterface: false,
	locale: {
		fn: {
			factory: () => () => defaultStore.get($locale)!,
			name: "getLocale",
		},
		hook: {
			factory: () => () => useAtomValue($locale)!,
			name: "useLocale",
		},
		setter: (locale) => {
			defaultStore.set($locale, locale);
		},
	},
	resources: {
		cache: new Map(),
		loaders: new Map(),
	},
	translations: {
		fn: {
			factory: (resources) => async (prefix) => {
				const locale = defaultStore.get($locale);

				// eslint-disable-next-line ts/no-unsafe-return
				return delve(await loadAndCacheTranslations(locale, resources), prefix);
			},
			name: "getTranslations",
		},
		hook: {
			factory: (resources) => {
				const $translations = atom((get) => {
					const locale = get($locale);

					return loadAndCacheTranslations(locale, resources);
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
	},
});
