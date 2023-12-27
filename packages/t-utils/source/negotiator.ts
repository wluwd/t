import { filterMatches } from "@fluent/langneg";

export type LocaleNegotiator<Locale> = (
	availableLocales: readonly Locale[],
) => Locale | undefined;

export type LocaleNegotiators<Locale> =
	| readonly [...(LocaleNegotiator<Locale> | false)[], Locale]
	| readonly [];

type Algorithm = (
	requestedLocales: readonly string[],
	availableLocales: readonly string[],
) => string[];

export const lookup: Algorithm = (requestedLocales, availableLocales) =>
	filterMatches(
		// @info `filterMatches` expects mutable arrays
		Array.from(requestedLocales),
		Array.from(availableLocales),
		"lookup",
	);

export const negotiator: (
	requestedLocales: readonly string[],
	algorithm: Algorithm,
) => LocaleNegotiator<string> =
	(requestedLocales, algorithm) => (availableLocales) =>
		algorithm(requestedLocales, availableLocales)[0];

export const browser = negotiator(
	globalThis.navigator?.languages ?? [],
	lookup,
);
