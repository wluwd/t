import type { LocaleNegotiators } from "./negotiator.ts";

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

export const isLocaleError = (
	error: unknown,
): error is NoLocaleFound | NoLocaleSet | NoTranslationsSet | UnknownLocale =>
	error instanceof NoLocaleFound ||
	error instanceof NoLocaleSet ||
	error instanceof NoTranslationsSet ||
	error instanceof UnknownLocale;
