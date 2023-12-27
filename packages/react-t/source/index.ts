import { createTranslationsFactory } from "@wluwd/t";
import { NoLocaleSet, NoTranslationsSet } from "@wluwd/t-utils/error";
import delve from "dlv";
import { atom, getDefaultStore, useAtomValue } from "jotai";
import { useMemo } from "react";

const $locale = atom<string | undefined>(undefined);
const defaultStore = getDefaultStore();

export const createTranslations = createTranslationsFactory({
	hasSignalLikeInterface: false,
	locale: {
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
		hook: {
			factory: ({ cache, loaders }) => {
				const $translations = atom(async (get) => {
					const locale = get($locale);

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
