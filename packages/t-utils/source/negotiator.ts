import { filterMatches } from "@fluent/langneg";

const typedFilterMatches = filterMatches as <
	Requested extends string,
	Available extends string,
>(
	requested: readonly Requested[],
	available: readonly Available[],
	strategy: "filtering" | "lookup" | "matching",
) => Available[];

export type LocaleNegotiator<TypeParamLocale extends string = string> = <
	Locale extends TypeParamLocale,
>(
	availableLocales: readonly Locale[],
) => Locale | undefined;

export type LocaleNegotiators<Locale extends string> =
	| readonly [...(LocaleNegotiator<Locale> | false)[], Locale]
	| readonly [];

type Algorithm = <Available extends string = string>(
	requestedLocales: readonly string[],
	availableLocales: readonly Available[],
) => Available[];

export const lookup: Algorithm = (requestedLocales, availableLocales) =>
	typedFilterMatches(requestedLocales, availableLocales, "lookup");

export const negotiator: (
	requestedLocales: readonly string[],
	algorithm: Algorithm,
) => LocaleNegotiator = (requestedLocales, algorithm) => (availableLocales) =>
	algorithm(requestedLocales, availableLocales)[0];

export const browser = () =>
	negotiator(globalThis.navigator?.languages ?? [], lookup);
