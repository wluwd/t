import { useStore } from "@nanostores/react";
import { defineTranslationsConfigFactory } from "@wluwd/t";
import delve from "dlv";
import ReactExports, { useMemo } from "react";

// `use` polyfill by jotai, https://github.com/pmndrs/jotai/blob/bae472500dea29ba876d80b8c066c54816970862/src/react/useAtomValue.ts#L13-L42
// eslint-disable-next-line ts/no-unsafe-assignment
const use =
	// @ts-expect-error use is still not available in React 18
	ReactExports.use ||
	(<T>(
		promise: PromiseLike<T> & {
			reason?: unknown;
			status?: "fulfilled" | "pending" | "rejected";
			value?: T;
		},
	): T => {
		if (promise.status === "pending") {
			// eslint-disable-next-line ts/no-throw-literal
			throw promise;
		} else if (promise.status === "fulfilled") {
			return promise.value as T;
		} else if (promise.status === "rejected") {
			throw promise.reason;
		} else {
			promise.status = "pending";
			promise.then(
				(v) => {
					promise.status = "fulfilled";
					promise.value = v;
				},
				(e) => {
					promise.status = "rejected";
					promise.reason = e;
				},
			);
			// eslint-disable-next-line ts/no-throw-literal
			throw promise;
		}
	});

export const defineTranslationsConfig = defineTranslationsConfigFactory(false, {
	locale: {
		getter: [
			"useLocale",
			({ atoms: { $locale } }) =>
				() =>
					useStore($locale)!,
		],
		setter: [
			"setLocale",
			({ atoms: { $locale } }) =>
				(locale) => {
					$locale.set(locale);
				},
		],
	},
	resources: {
		cache: new Map(),
		loaders: new Map(),
	},
	translations: [
		"useTranslations",
		({ atoms: { $translations } }) =>
			(prefix) => {
				// eslint-disable-next-line ts/no-unsafe-assignment, ts/no-unsafe-call
				const translations = use(useStore($translations));

				// eslint-disable-next-line ts/no-unsafe-return
				return useMemo(
					// eslint-disable-next-line ts/no-unsafe-return, ts/no-unsafe-argument
					() => delve(translations, prefix),
					[prefix, translations],
				);
			},
	],
});
