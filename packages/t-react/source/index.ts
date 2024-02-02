import { createDefineTranslationsConfig } from "@wluwd/t";
import { NoLocaleSet, NoTranslationsSet } from "@wluwd/t-utils";
import delve from "dlv";
import { atom, getDefaultStore, useAtomValue } from "jotai";
import { useMemo } from "react";

const $locale = atom<string | undefined>(undefined);
const defaultStore = getDefaultStore();

export const defineTranslationsConfig = createDefineTranslationsConfig(false, {
	locale: {
		fn: ["getLocale", () => () => defaultStore.get($locale)!],
		hook: ["useLocale", () => () => useAtomValue($locale)!],
		setter: [
			"setLocale",
			() => (locale) => {
				defaultStore.set($locale, locale);
			},
		],
	},
	resources: {
		cache: new Map(),
		loaders: new Map(),
	},
	translations: {
		fn: [
			"getTranslations",
			(loader, resources) => async (prefix) => {
				const locale = defaultStore.get($locale);

				// eslint-disable-next-line ts/no-unsafe-return
				return delve(await loader(locale, resources), prefix);
			},
		],
		hook: [
			"useTranslations",
			(loader, resources) => {
				const $translations = atom((get) => {
					const locale = get($locale);

					return loader(locale, resources);
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
		],
		loader: async (locale, { cache, loaders }) => {
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
		},
	},
});
