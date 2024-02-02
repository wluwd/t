import { isKeyof } from "./utils.ts";
import { NoLocaleFound, UnknownLocale } from "@wluwd/t-utils";

import type {
	AnyFormatter,
	ExtractTranslations,
	FromNamedFactory,
	NamedFactory,
	PathsToBranches,
} from "./utils.ts";
import type {
	AnyTranslations,
	LazyLoader,
	LocaleNegotiators,
} from "@wluwd/t-utils";
import type {
	Get,
	Promisable,
	RequiredDeep,
	Simplify,
	ValueOf,
} from "type-fest";

export type TranslationsPicker<
	SignalInterface extends boolean,
	Translations extends AnyTranslations = AnyTranslations,
> = <Prefix extends PathsToBranches<Translations>>(
	prefix: Prefix,
) => SignalInterface extends true
	? () => Get<Translations, Prefix>
	: Get<Translations, Prefix>;

export type AsyncTranslationsPicker<
	Translations extends AnyTranslations = AnyTranslations,
> = <Prefix extends PathsToBranches<Translations>>(
	prefix: Prefix,
) => Promisable<Get<Translations, Prefix>>;

export type LocaleGetter<
	SignalInterface extends boolean,
	Locale extends string = string,
> = () => SignalInterface extends true ? () => Locale : Locale;

export type LocaleSetter<AllowedLocales extends string = string> = (
	locale: AllowedLocales,
) => void;

export interface Options<
	SignalInterface extends boolean = false,
	Loaders extends Record<string, LazyLoader> = Record<string, LazyLoader>,
	Locale extends string = keyof Loaders & string,
	Translations extends AnyTranslations = ValueOf<ExtractTranslations<Loaders>>,
> {
	locale: {
		fn?: NamedFactory<() => LocaleGetter<SignalInterface, Locale>>;
		hook: NamedFactory<() => LocaleGetter<SignalInterface, Locale>>;
		setter: NamedFactory<() => LocaleSetter<Locale>>;
	};
	resources: {
		cache: Map<string, Translations>;
		loaders: Map<string, LazyLoader>;
	};
	translations: {
		fn?: NamedFactory<
			(
				loader: Options["translations"]["loader"],
				resources: Options["resources"],
			) => AsyncTranslationsPicker<Translations>
		>;
		hook: NamedFactory<
			(
				loader: Options["translations"]["loader"],
				resources: Options["resources"],
			) => TranslationsPicker<SignalInterface, Translations>
		>;
		loader: (
			locale: string | undefined,
			resources: Options["resources"],
		) => Promisable<Translations>;
	};
}

export type LazyInit<Locale extends string> = (
	negotiators?: LocaleNegotiators<Locale>,
) => void;

export type InjectLazyInit<
	Lazy extends boolean,
	Locale extends string,
	Target extends object,
> = Lazy extends true ? { init: LazyInit<Locale> } & Target : Target;

export type DefineTranslationsConfig<
	SignalInterface extends boolean,
	InferredOptions extends Options<SignalInterface>,
> = <
	Loaders extends Record<string, LazyLoader>,
	Formatter extends AnyFormatter,
	Lazy extends boolean = false,
	TypedOptions extends RequiredDeep<
		Options<SignalInterface, Loaders>
	> = RequiredDeep<Options<SignalInterface, Loaders>>,
>(
	translationLoaders: Loaders,
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
		{
			t: Formatter;
		} & FromNamedFactory<
			InferredOptions["locale"]["hook"],
			TypedOptions["locale"]["hook"]
		> &
			FromNamedFactory<
				InferredOptions["locale"]["setter"],
				TypedOptions["locale"]["setter"]
			> &
			FromNamedFactory<
				InferredOptions["locale"]["fn"],
				TypedOptions["locale"]["fn"]
			> &
			FromNamedFactory<
				InferredOptions["translations"]["hook"],
				TypedOptions["translations"]["hook"]
			> &
			FromNamedFactory<
				InferredOptions["translations"]["fn"],
				TypedOptions["translations"]["fn"]
			>
	>
>;

export type CreateDefineTranslationsConfig = <
	SignalInterface extends boolean,
	const InferredOptions extends Options<SignalInterface>,
>(
	hasSignalLikeInterface: SignalInterface,
	options: InferredOptions,
) => DefineTranslationsConfig<SignalInterface, InferredOptions>;

export const createDefineTranslationsConfig: CreateDefineTranslationsConfig =
	(
		hasSignalLikeInterface,
		{
			locale: { fn: localeFn, hook: localeHookFactory, setter: localeSetter },
			resources: { cache: globalCache, loaders },
			translations: {
				fn: translationsFn,
				hook: translationsHookFactory,
				loader: translationLoader,
			},
		},
	) =>
	(
		translationLoaders,
		{ cache: initialCache, formatter, localeSource: negotiators },
		lazy,
	) => {
		const initializedLocaleSetter = localeSetter[1]();

		const init = (initNegotiators?: LocaleNegotiators<string>) => {
			for (const [locale, loader] of Object.entries(translationLoaders)) {
				loaders.set(locale, loader);
			}

			if (initialCache) {
				for (const [locale, translations] of Object.entries(initialCache)) {
					if (translations) {
						globalCache.set(locale, translations);
					}
				}
			}

			const availableLocales = Object.keys(translationLoaders);

			const activeNegotiators =
				initNegotiators !== undefined ? initNegotiators : negotiators;

			for (const negotiator of activeNegotiators) {
				if (negotiator === false) {
					continue;
				}

				const negotiatedLocale =
					typeof negotiator === "string"
						? negotiator
						: negotiator(availableLocales);

				if (negotiatedLocale !== undefined) {
					if (isKeyof(translationLoaders, negotiatedLocale)) {
						initializedLocaleSetter(negotiatedLocale);

						return;
					} else {
						throw new UnknownLocale({
							availableLocales: Object.keys(translationLoaders),
							desiredLocale: negotiatedLocale,
							negotiator,
						});
					}
				}
			}

			if (activeNegotiators.length !== 0) {
				throw new NoLocaleFound({
					availableLocales: Object.keys(translationLoaders),
					negotiators: activeNegotiators,
				});
			}
		};

		if (lazy !== true) {
			init();
		}

		// eslint-disable-next-line ts/no-unsafe-return
		return <any>{
			...(lazy && {
				init,
			}),
			[localeHookFactory[0]]: localeHookFactory[1](),
			...(localeFn && { [localeFn[0]]: localeFn[1]() }),
			[localeSetter[0]]: initializedLocaleSetter,
			[translationsHookFactory[0]]: translationsHookFactory[1](
				translationLoader,
				{
					cache: globalCache,
					loaders,
				},
			),
			...(translationsFn && {
				[translationsFn[0]]: translationsFn[1](translationLoader, {
					cache: globalCache,
					loaders,
				}),
			}),
			t: formatter,
		};
	};
