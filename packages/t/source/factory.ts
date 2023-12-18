import { t } from "~/translator.ts";
import { isKeyof } from "~/utils.ts";

import type { Translator } from "~/translator.ts";
import type { Get, Simplify, ValueOf } from "type-fest";

export class UnknownDefaultLocaleStrategy extends Error {
	details: {
		availableLocales: Array<string>;
		availableStrategies: Array<string>;
		desiredFallback: string;
		desiredStrategy: string;
	};

	constructor(
		details: UnknownDefaultLocaleStrategy["details"],
		options?: ErrorOptions,
	) {
		super(
			`Tried to use an unknown \`defaultLocale\` strategy (\`[${
				details.desiredStrategy
			}, ${
				details.desiredFallback
			}]\`).\n\nAvailable strategies: \`[${details.availableStrategies.join(
				" | ",
			)}, ${details.availableLocales.join(" | ")}]\`.`,
			options,
		);

		this.details = details;
	}
}

export class UnknownDefaultLocale extends Error {
	details: {
		availableLocales: Array<string>;
		desiredLocale: string;
	};

	constructor(
		details: UnknownDefaultLocale["details"],
		options?: ErrorOptions,
	) {
		super(
			`Tried to set an unknown \`defaultLocale\` (${
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
		availableLocales: Array<number | string>;
		desiredLocale: number | string;
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

export type LazyLoader = () => Promise<Record<string, unknown>>;

export type GetTranslationsHook<
	Translations extends Record<string, unknown> = Record<string, unknown>,
> = <Prefix extends PathsToBranches<Translations>>(
	prefix: Prefix,
) => Get<Translations, Prefix>;

export type SetLocale<AllowedLocales extends string = string> = (
	locale: AllowedLocales,
) => void;

export type GetLocaleHook<AllowedLocales extends string = string> =
	() => AllowedLocales;

export interface CreateTranslationsFactoryOptions<
	GetTranslationsHookName extends string = "",
	GetLocaleHookName extends string = "",
> {
	cache: Map<string, Awaited<ReturnType<LazyLoader>>>;
	getTranslationsHook: {
		factory: (
			options: Pick<CreateTranslationsFactoryOptions, "cache" | "lazyLoaders">,
		) => GetTranslationsHook;
		name: GetTranslationsHookName;
	};
	lazyLoaders: Map<string, LazyLoader>;
	locale: {
		getter: {
			factory: () => GetLocaleHook;
			name: GetLocaleHookName;
		};
		negotiator: (availableLocales: string[], fallback: string) => string;
		setter: SetLocale;
	};
}

export const createTranslationsFactory =
	<GetTranslationsHookName extends string, GetLocaleHookName extends string>({
		cache,
		getTranslationsHook: {
			factory: getTranslationsHookFactory,
			name: getTranslationsHookName,
		},
		lazyLoaders,
		locale: {
			getter: { factory: getLocaleHookFactory, name: getLocaleHookName },
			negotiator: localeNegotiator,
			setter: setLocale,
		},
	}: CreateTranslationsFactoryOptions<
		GetTranslationsHookName,
		GetLocaleHookName
	>) =>
	<
		Translations extends Record<string, LazyLoader>,
		AllowedLocales extends keyof Translations & string,
		DefaultLocale extends
			| [strategy: "auto", fallback: AllowedLocales]
			| AllowedLocales,
	>(
		translations: Translations,
		defaultLocale?: DefaultLocale,
	): Simplify<
		{
			[k in GetTranslationsHookName]: GetTranslationsHook<
				Awaited<ReturnType<ValueOf<Translations>>>
			>;
		} & {
			[k in GetLocaleHookName]: GetLocaleHook<AllowedLocales>;
		} & {
			setLocale: SetLocale<AllowedLocales>;
			t: Translator;
		}
	> => {
		for (const [locale, lazyLoader] of Object.entries(translations)) {
			lazyLoaders.set(locale, lazyLoader);
		}

		if (defaultLocale !== undefined) {
			if (Array.isArray(defaultLocale)) {
				const [strategy, fallback] = defaultLocale;

				if (strategy === "auto" && isKeyof(translations, fallback)) {
					setLocale(localeNegotiator(Object.keys(translations), fallback));
				} else {
					throw new UnknownDefaultLocaleStrategy({
						availableLocales: Object.keys(translations),
						availableStrategies: ["auto"],
						desiredFallback: fallback,
						desiredStrategy: strategy,
					});
				}
			} else if (isKeyof(translations, defaultLocale)) {
				setLocale(defaultLocale);
			} else {
				throw new UnknownDefaultLocale({
					availableLocales: Object.keys(translations),
					desiredLocale: defaultLocale,
				});
			}
		}

		// eslint-disable-next-line ts/no-unsafe-return
		return <any>{
			[getLocaleHookName]: getLocaleHookFactory(),
			[getTranslationsHookName]: getTranslationsHookFactory({
				cache,
				lazyLoaders,
			}),
			setLocale,
			t,
		};
	};
