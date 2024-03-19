import { computed, isKeyof } from "./utils.ts";
import {
	type AnyTranslations,
	type LazyLoader,
	type LocaleNegotiators,
	NoLocaleFound,
	NoLocaleSet,
	NoTranslationsSet,
	UnknownLocale,
} from "@wluwd/t-utils";
import { atom } from "nanostores";

import type {
	AnyFormatter,
	ExtractTranslations,
	FromNamedFactory,
	NamedFactory,
	PathsToBranches,
} from "./utils.ts";
import type { ReadableAtom, WritableAtom } from "nanostores";
import type { Get, Simplify, ValueOf } from "type-fest";

// needed for compiling `.d.ts` files
export type { AnyFormatter, ExtractTranslations, NamedFactory };

export type LazyInit<Locale extends string> = (
	negotiators?: LocaleNegotiators<Locale>,
) => void;

export interface Atoms<Locale, Translations> {
	$locale: WritableAtom<Locale>;
	$translations: ReadableAtom<Translations>;
}

export type InjectLazyInit<
	Lazy extends boolean,
	Locale extends string,
	Target extends object,
> = Lazy extends true ? { init: LazyInit<Locale> } & Target : Target;

export interface Options<
	SignalInterface extends boolean = false,
	Loaders extends Record<string, LazyLoader> = Record<string, LazyLoader>,
	Locale extends string = keyof Loaders & string,
	Translations extends AnyTranslations = ValueOf<ExtractTranslations<Loaders>>,
> {
	locale: {
		getter: NamedFactory<
			(options: {
				atoms: Atoms<Locale, Translations>;
			}) => () => SignalInterface extends true ? () => Locale : Locale
		>;
		setter: NamedFactory<
			(options: {
				atoms: Atoms<Locale, Translations>;
			}) => (locale: Locale) => void
		>;
	};
	resources: {
		cache: Map<string, Translations>;
		loaders: Map<string, LazyLoader>;
	};
	translations: NamedFactory<
		(
			resources: Options["resources"] & {
				atoms: Atoms<Locale, Translations>;
			},
		) => <Prefix extends PathsToBranches<Translations>>(
			prefix: Prefix,
		) => SignalInterface extends true
			? () => Get<Translations, Prefix>
			: Get<Translations, Prefix>
	>;
}

export type DefineTranslationsConfigFactory = <
	SignalInterface extends boolean,
	const InitialOptions extends Options<SignalInterface>,
>(
	hasSignalLikeInterface: SignalInterface,
	options: InitialOptions,
) => <
	Loaders extends Record<string, LazyLoader>,
	Formatter extends AnyFormatter,
	Lazy extends boolean = false,
	TypedOptions extends Options<SignalInterface, Loaders> = Options<
		SignalInterface,
		Loaders
	>,
>(
	translationsLoaders: Loaders,
	options: {
		cache?: Partial<ExtractTranslations<Loaders>>;
		formatter: Formatter;
		localeSource: LocaleNegotiators<keyof Loaders & string>;
	},
	lazy?: Lazy,
) => Simplify<
	InjectLazyInit<
		Lazy,
		keyof Loaders & string,
		{ t: Formatter } & Atoms<
			keyof Loaders & string,
			Promise<Simplify<ValueOf<ExtractTranslations<Loaders>>>>
		> &
			FromNamedFactory<
				InitialOptions["locale"]["getter"],
				TypedOptions["locale"]["getter"]
			> &
			FromNamedFactory<
				InitialOptions["locale"]["setter"],
				TypedOptions["locale"]["setter"]
			> &
			FromNamedFactory<
				InitialOptions["translations"],
				TypedOptions["translations"]
			>
	>
>;

export const defineTranslationsConfigFactory: DefineTranslationsConfigFactory =
	(
		hasSignalLikeInterface,
		{
			locale: {
				getter: [localeGetterName, localeGetterFactory],
				setter: [localeSetterName, localeSetterFactory],
			},
			resources: { cache: globalCache, loaders },
			translations: [translationsHookName, translationsHookFactory],
		},
	) =>
	(
		translationsLoaders,
		{ cache: initialCache, formatter, localeSource: negotiators },
		lazy,
	) => {
		const $locale = atom<string | undefined>();
		const $translations = computed([$locale], async (locale) => {
			if (locale === undefined) {
				throw new NoLocaleSet();
			}

			let translations = globalCache.get(locale);

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

			globalCache.set(locale, translations);

			return translations;
		});

		const init = (initNegotiators?: LocaleNegotiators<string>) => {
			for (const [locale, loader] of Object.entries(translationsLoaders)) {
				loaders.set(locale, loader);
			}

			if (initialCache) {
				for (const [locale, translations] of Object.entries(initialCache)) {
					if (translations === undefined) {
						continue;
					}

					globalCache.set(locale, translations);
				}
			}

			const availableLocales = Object.keys(translationsLoaders);

			const activeNegotiators = initNegotiators ?? negotiators;

			for (const negotiator of activeNegotiators) {
				if (negotiator === false) {
					continue;
				}

				const negotiatedLocale =
					typeof negotiator === "string"
						? negotiator
						: negotiator(availableLocales);

				if (negotiatedLocale === undefined) {
					continue;
				}

				if (isKeyof(translationsLoaders, negotiatedLocale)) {
					$locale.set(negotiatedLocale);

					return;
				}

				throw new UnknownLocale({
					availableLocales: Object.keys(translationsLoaders),
					desiredLocale: negotiatedLocale,
					negotiator,
				});
			}

			if (activeNegotiators.length !== 0) {
				throw new NoLocaleFound({
					availableLocales: Object.keys(translationsLoaders),
					negotiators: activeNegotiators,
				});
			}
		};

		if (lazy !== true) {
			init();
		}

		const atoms = <never>{
			$locale,
			$translations,
		};

		return <never>{
			$locale,
			$translations,
			[localeGetterName]: localeGetterFactory({
				atoms,
			}),
			[localeSetterName]: localeSetterFactory({
				atoms,
			}),
			t: formatter,
			[translationsHookName]: translationsHookFactory({
				atoms,
				cache: globalCache,
				loaders,
			}),
			...(lazy && {
				init,
			}),
		};
	};
