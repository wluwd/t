import { isKeyof } from "~/utils.ts";

import type { Get, Simplify, ValueOf } from "type-fest";

export class NoLocaleFound extends Error {
	details: {
		availableLocales: readonly string[];
		negotiators: LocaleNegotiators<any>;
	};

	constructor(details: NoLocaleFound["details"], options?: ErrorOptions) {
		super(
			`All negotiators failed to find a fitting \`locale\`, this error should never happen.\n\nNegotiators: \`[${details.negotiators.join(
				", ",
			)}]\`.\n\nAvailable locales: ${details.availableLocales.join(", ")}.`,
			options,
		);

		this.details = details;
	}
}

export class UnknownLocale extends Error {
	details: {
		availableLocales: readonly string[];
		desiredLocale: string;
		negotiator: LocaleNegotiators<any>[number];
	};

	constructor(details: UnknownLocale["details"], options?: ErrorOptions) {
		super(
			`A negotiator returned an unknown \`locale\` (${
				details.desiredLocale
			}).\n\nAvailable locales: ${details.availableLocales.join(", ")}.`,
			options,
		);

		this.details = details;
	}
}

export class NoLocaleSet extends Error {
	constructor(options?: ErrorOptions) {
		super(
			`Attempted to access translations without a specified locale.\n\nThis error typically occurs due to one of the following reasons:\n\n1. The \`defaultLocale\` was unintentionally omitted.\n2. The \`defaultLocale\` was intentionally omitted, but \`setLocale\` was not called — either by mistake or due to a race condition.`,
			options,
		);
	}
}

export class NoTranslationsSet extends Error {
	details: {
		availableLocales: readonly string[];
		desiredLocale: string;
	};

	constructor(details: NoTranslationsSet["details"], options?: ErrorOptions) {
		super(
			`Tried to load translations for ${
				details.desiredLocale
			}, but no loader was found for that locale.\n\nAvailable locales: ${details.availableLocales.join(
				", ",
			)}.`,
			options,
		);

		this.details = details;
	}
}

type ConcatKeys<
	Previous extends string,
	New extends string,
> = Previous extends "" ? New : `${Previous}.${New}`;

type PathsToBranches<
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

type AnyFunction = (...args: any) => any;

interface Factory<
	Fn extends AnyFunction = AnyFunction,
	Name extends string | undefined = string,
> {
	factory: Fn;
	name: Name;
}

interface Fn<
	Fn extends AnyFunction = AnyFunction,
	Name extends string | undefined = string,
> {
	fn: Fn;
	name: Name;
}

type AnyTranslations = Record<string, unknown>;
type LazyLoader<Return = AnyTranslations> = () => Promise<Return>;

export type LocaleNegotiator<Locale> = (
	availableLocales: readonly Locale[],
) => Locale | undefined;

type LocaleNegotiators<Locale> =
	| readonly [...(LocaleNegotiator<Locale> | false)[], Locale]
	| readonly [];

type LocaleSetter<AllowedLocales extends string = string> = (
	locale: AllowedLocales,
) => void;

export interface CreateTranslationsFactoryOptions<
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
				resources: CreateTranslationsFactoryOptions<
					SignalLike,
					string,
					string,
					string,
					string
				>["resources"],
			) => TranslationsPicker<AnyTranslations, false>,
			TranslationsGetterFunctionName
		>;
		hook: Factory<
			(
				resources: CreateTranslationsFactoryOptions<
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

type AnyTranslator = (translation: string, data: any) => string;

type LocaleGetter<
	Locale extends string,
	SignalLike extends boolean,
> = () => SignalLike extends true ? () => Locale : Locale;

type TranslationsPicker<
	Translations extends AnyTranslations,
	SignalLike extends boolean,
> = <Prefix extends PathsToBranches<Translations>>(
	prefix: Prefix,
) => SignalLike extends true
	? () => Get<Translations, Prefix>
	: Get<Translations, Prefix>;

type LocaleGetterHookBuilder<
	Options extends Fn<LocaleGetter<string, boolean>, string>,
> = {
	[key in Options["name"]]: Options["fn"];
};

type LocaleGetterFunctionBuilder<
	Options extends Fn<LocaleGetter<string, false>, string> | undefined,
> = Options extends object
	? {
			[key in Options["name"]]: Options["fn"];
		}
	: object;

type TranslationsGetterHookBuilder<
	Options extends Fn<TranslationsPicker<AnyTranslations, boolean>, string>,
> = {
	[key in Options["name"]]: Options["fn"];
};

type TranslationsGetterFunctionBuilder<
	Options extends
		| Fn<TranslationsPicker<AnyTranslations, false>, string>
		| undefined,
> = Options extends object
	? {
			[key in Options["name"]]: Options["fn"];
		}
	: object;

type CreateTranslationsInstance<
	Locale extends string,
	Translations extends AnyTranslations,
	Options extends {
		locale: {
			function?: Fn<LocaleGetter<Locale, false>, string>;
			hook: Fn<LocaleGetter<Locale, boolean>, string>;
			setter: LocaleSetter<Locale>;
		};
		translations: {
			function?: Fn<TranslationsPicker<Translations, false>, string>;
			hook: Fn<TranslationsPicker<Translations, boolean>, string>;
		};
		translator: AnyTranslator;
	},
> = LocaleGetterHookBuilder<Options["locale"]["hook"]> &
	LocaleGetterFunctionBuilder<Options["locale"]["function"]> &
	TranslationsGetterHookBuilder<Options["translations"]["hook"]> &
	TranslationsGetterFunctionBuilder<Options["translations"]["function"]> & {
		setLocale: Options["locale"]["setter"];
		t: Options["translator"];
	};

type WithLazyInit<
	Lazy extends boolean,
	Locale extends string,
	Input extends object,
> = Lazy extends true
	? {
			initTranslator: (negotiators?: LocaleNegotiators<Locale>) => void;
		} & Input
	: Input;

export const createTranslationsFactory =
	<
		SignalLike extends boolean,
		LocaleGetterHookName extends string,
		TranslationsGetterHookName extends string,
		LocaleGetterFunctionName extends string | undefined = undefined,
		TranslationsGetterFunctionName extends string | undefined = undefined,
	>({
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
	}: CreateTranslationsFactoryOptions<
		SignalLike,
		LocaleGetterFunctionName,
		LocaleGetterHookName,
		TranslationsGetterFunctionName,
		TranslationsGetterHookName
	>) =>
	<
		Loaders extends Record<string, LazyLoader>,
		Locale extends keyof Loaders & string,
		Translations extends Awaited<ReturnType<ValueOf<Loaders>>>,
		Translator extends AnyTranslator,
		Lazy extends boolean = false,
	>(
		translationLoaders: Loaders,
		{
			cache: initialCache,
			localeFrom: negotiators,
			translator,
		}: {
			cache?: Partial<Record<Locale, Translations>>;
			localeFrom: LocaleNegotiators<keyof Loaders & string>;
			translator: Translator;
		},
		lazy?: Lazy,
	): Simplify<
		WithLazyInit<
			Lazy,
			Locale,
			CreateTranslationsInstance<
				Locale,
				Translations,
				{
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
									fn: TranslationsPicker<Translations, false>;
									name: TranslationsGetterFunctionName;
								};
						hook: {
							fn: TranslationsPicker<Translations, SignalLike>;
							name: TranslationsGetterHookName;
						};
					};
					translator: Translator;
				}
			>
		>
	> => {
		const initTranslator = (initNegotiators?: LocaleNegotiators<Locale>) => {
			for (const [locale, loader] of Object.entries(translationLoaders) as [
				Locale,
				LazyLoader,
			][]) {
				loaders.set(locale, loader);
			}

			if (initialCache) {
				for (const [locale, translations] of Object.entries(initialCache) as [
					Locale,
					Translations,
				][]) {
					globalCache.set(locale, translations);
				}
			}

			const availableLocales = Object.keys(translationLoaders) as Locale[];

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
			initTranslator();
		}

		// eslint-disable-next-line ts/no-unsafe-return
		return <any>{
			...(lazy && {
				initTranslator,
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
