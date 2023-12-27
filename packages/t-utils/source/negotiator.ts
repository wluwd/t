export type LocaleNegotiator<Locale> = (
	availableLocales: readonly Locale[],
) => Locale | undefined;

export type LocaleNegotiators<Locale> =
	| readonly [...(LocaleNegotiator<Locale> | false)[], Locale]
	| readonly [];
