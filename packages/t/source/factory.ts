import { isKeyof } from "./utils.ts";
import { NoLocaleFound, UnknownLocale } from "@wluwd/t-utils";

import type {
	AnyTranslations,
	LazyLoader,
	LocaleNegotiators,
} from "@wluwd/t-utils";
import type { Get, Simplify, ValueOf } from "type-fest";

export type ConcatKeys<
	Previous extends string,
	New extends string,
> = Previous extends "" ? New : `${Previous}.${New}`;

export type PathsToBranches<
	Branch extends Record<string, unknown>,
	KeysFound extends string = "",
> = Simplify<
	{
		[K in keyof Branch & string]: Branch[K] extends Record<string, unknown>
			?
					| ConcatKeys<KeysFound, K>
					| PathsToBranches<Branch[K], ConcatKeys<KeysFound, K>>
			: KeysFound;
	}[keyof Branch & string]
> &
	string;

export type AnyFunction = (...args: any) => any;

export interface Factory<
	Fn extends AnyFunction = AnyFunction,
	Name extends string | undefined = string,
> {
	factory: Fn;
	name: Name;
}

export interface Fn<
	Fn extends AnyFunction = AnyFunction,
	Name extends string | undefined = string,
> {
	fn: Fn;
	name: Name;
}

export type LocaleSetter<AllowedLocales extends string = string> = (
	locale: AllowedLocales,
) => void;

export interface CreateDefineTranslationsConfigOptions<
	SignalLike extends boolean,
	LocaleGetterFunctionName extends string | undefined,
	LocaleGetterHookName extends string,
	TranslationsGetterFunctionName extends string | undefined,
	TranslationsGetterHookName extends string,
> {
	hasSignalLikeInterface: SignalLike;
	locale: {
		fn?: Factory<() => LocaleGetter<string, false>, LocaleGetterFunctionName>;
		hook: Factory<() => LocaleGetter<string, SignalLike>, LocaleGetterHookName>;
		setter: LocaleSetter<string>;
	};
	resources: {
		cache: Map<string, AnyTranslations>;
		loaders: Map<string, LazyLoader>;
	};
	translations: {
		fn?: Factory<
			(
				resources: CreateDefineTranslationsConfigOptions<
					SignalLike,
					string,
					string,
					string,
					string
				>["resources"],
			) => TranslationsPickerAsync<AnyTranslations>,
			TranslationsGetterFunctionName
		>;
		hook: Factory<
			(
				resources: CreateDefineTranslationsConfigOptions<
					SignalLike,
					string,
					string,
					string,
					string
				>["resources"],
			) => TranslationsPicker<AnyTranslations, SignalLike>,
			TranslationsGetterHookName
		>;
	};
}

export type AnyFormatter = (translation: string, data: any) => string;

export type LocaleGetter<
	Locale extends string,
	SignalLike extends boolean,
> = () => SignalLike extends true ? () => Locale : Locale;

export type TranslationsPicker<
	Translations extends AnyTranslations,
	SignalLike extends boolean,
> = <Prefix extends PathsToBranches<Translations>>(
	prefix: Prefix,
) => SignalLike extends true
	? () => Get<Translations, Prefix>
	: Get<Translations, Prefix>;

export type TranslationsPickerAsync<Translations extends AnyTranslations> = <
	Prefix extends PathsToBranches<Translations>,
>(
	prefix: Prefix,
) => Promise<Get<Translations, Prefix>>;

export type LocaleGetterHookBuilder<
	Options extends Fn<LocaleGetter<string, boolean>, string>,
> = {
	[key in Options["name"]]: Options["fn"];
};

export type LocaleGetterFunctionBuilder<
	Options extends Fn<LocaleGetter<string, false>, string> | undefined,
> = Options extends object
	? {
			[key in Options["name"]]: Options["fn"];
		}
	: object;

export type TranslationsGetterHookBuilder<
	Options extends Fn<TranslationsPicker<AnyTranslations, boolean>, string>,
> = {
	[key in Options["name"]]: Options["fn"];
};

export type TranslationsGetterFunctionBuilder<
	Options extends
		| Fn<TranslationsPickerAsync<AnyTranslations>, string>
		| undefined,
> = Options extends object
	? {
			[key in Options["name"]]: Options["fn"];
		}
	: object;

export type DefineTranslationsConfig<
	Locale extends string,
	Translations extends AnyTranslations,
	Options extends {
		formatter: AnyFormatter;
		locale: {
			function?: Fn<LocaleGetter<Locale, false>, string>;
			hook: Fn<LocaleGetter<Locale, boolean>, string>;
			setter: LocaleSetter<Locale>;
		};
		translations: {
			function?: Fn<TranslationsPickerAsync<Translations>, string>;
			hook: Fn<TranslationsPicker<Translations, boolean>, string>;
		};
	},
> = LocaleGetterHookBuilder<Options["locale"]["hook"]> &
	LocaleGetterFunctionBuilder<Options["locale"]["function"]> &
	TranslationsGetterHookBuilder<Options["translations"]["hook"]> &
	TranslationsGetterFunctionBuilder<Options["translations"]["function"]> & {
		setLocale: Options["locale"]["setter"];
		t: Options["formatter"];
	};

export type WithLazyInit<
	Lazy extends boolean,
	Locale extends string,
	Input extends object,
> = Lazy extends true
	? {
			init: (negotiators?: LocaleNegotiators<Locale>) => void;
		} & Input
	: Input;

export type CreateDefineTranslationsConfig = <
	SignalLike extends boolean,
	LocaleGetterHookName extends string,
	TranslationsGetterHookName extends string,
	LocaleGetterFunctionName extends string | undefined = undefined,
	TranslationsGetterFunctionName extends string | undefined = undefined,
>(
	options: CreateDefineTranslationsConfigOptions<
		SignalLike,
		LocaleGetterFunctionName,
		LocaleGetterHookName,
		TranslationsGetterFunctionName,
		TranslationsGetterHookName
	>,
) => <
	Loaders extends Record<string, LazyLoader>,
	Locale extends keyof Loaders & string,
	Translations extends Awaited<ReturnType<ValueOf<Loaders>>>,
	Formatter extends AnyFormatter,
	Lazy extends boolean = false,
>(
	translationLoaders: Loaders,
	options: {
		cache?: Partial<Record<Locale, Translations>>;
		formatter: Formatter;
		localeSource: LocaleNegotiators<keyof Loaders & string>;
	},
	lazy?: Lazy,
) => Simplify<
	WithLazyInit<
		Lazy,
		Locale,
		DefineTranslationsConfig<
			Locale,
			Translations,
			{
				formatter: Formatter;
				locale: {
					function: LocaleGetterFunctionName extends undefined
						? undefined
						: {
								fn: LocaleGetter<Locale, false>;
								name: LocaleGetterFunctionName;
							};
					hook: {
						fn: LocaleGetter<Locale, SignalLike>;
						name: LocaleGetterHookName;
					};
					setter: LocaleSetter<Locale>;
				};
				translations: {
					function: TranslationsGetterFunctionName extends undefined
						? undefined
						: {
								fn: TranslationsPickerAsync<Translations>;
								name: TranslationsGetterFunctionName;
							};
					hook: {
						fn: TranslationsPicker<Translations, SignalLike>;
						name: TranslationsGetterHookName;
					};
				};
			}
		>
	>
>;

export const createDefineTranslationsConfig: CreateDefineTranslationsConfig =
	({
		locale: {
			fn: localeFn,
			hook: { factory: localeHookFactory, name: localeHookName },
			setter: localeSetter,
		},
		resources: { cache: globalCache, loaders },
		translations: {
			fn: translationsFn,
			hook: { factory: translationsHookFactory, name: translationsHookName },
		},
	}) =>
	(
		translationLoaders,
		{ cache: initialCache, formatter: translator, localeSource: negotiators },
		lazy,
	) => {
		const init = (initNegotiators?: LocaleNegotiators<string>) => {
			for (const [locale, loader] of Object.entries(translationLoaders)) {
				loaders.set(locale, loader);
			}

			if (initialCache) {
				for (const [locale, translations] of Object.entries(initialCache) as [
					string,
					AnyTranslations,
				][]) {
					globalCache.set(locale, translations);
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
						localeSetter(negotiatedLocale);

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
			[localeHookName]: localeHookFactory(),
			...(localeFn?.name && { [localeFn.name]: localeFn.factory() }),
			setLocale: localeSetter,
			[translationsHookName]: translationsHookFactory({
				cache: globalCache,
				loaders,
			}),
			...(translationsFn?.name && {
				[translationsFn.name]: translationsFn.factory({
					cache: globalCache,
					loaders,
				}),
			}),
			t: translator,
		};
	};
