import { renderHook, waitFor } from "@testing-library/react";
import {
	NoLocaleSet,
	NoTranslationsSet,
	formatter,
	lazyTranslations,
} from "@wluwd/t-utils";
import { defineTranslationsConfig } from "~/index.ts";
import { Component } from "react";
import { describe, expect, it } from "vitest";

import type { ReactNode } from "react";

const enGB = { default: { some: { deep: { string: "en-GB" } } } } as const;
const enUS = { default: { some: { deep: { string: "en-US" } } } } as const;

const translations = {
	"en-GB": lazyTranslations(() => Promise.resolve(enGB)),
	"en-US": lazyTranslations(() => Promise.resolve(enUS)),
};

class ErrorBoundary extends Component<{
	children: ReactNode;
	error: { current: Error | undefined };
}> {
	componentDidCatch(error: Error) {
		this.props.error.current = error;
	}

	render() {
		return this.props.children;
	}
}

describe("throws", () => {
	it("`NoLocaleSet` when trying to access translations without a specified locale", async () => {
		const { useLocale, useTranslations } = defineTranslationsConfig(
			translations,
			{
				formatter,
				localeSource: [],
			},
		);

		const { result: locale } = renderHook(() => useLocale());
		expect(locale.current).toBe(undefined);

		const error = { current: undefined };

		renderHook(() => useTranslations("some.deep"), {
			wrapper: ({ children }) => (
				<ErrorBoundary error={error}>{children}</ErrorBoundary>
			),
		});

		await waitFor(() => expect(error.current).toBeInstanceOf(NoLocaleSet));
	});

	it("`NoTranslationsSet` when trying to load translations that have no loader", async () => {
		const { setLocale, useLocale, useTranslations } = defineTranslationsConfig(
			translations,
			{ formatter, localeSource: [] },
		);

		const { result: locale } = renderHook(() => useLocale());
		expect(locale.current).toBe(undefined);

		const error = { current: undefined };

		renderHook(() => useTranslations("some.deep"), {
			wrapper: ({ children }) => (
				<ErrorBoundary error={error}>{children}</ErrorBoundary>
			),
		});

		// @ts-expect-error testing undefined translations
		setLocale("en-AU");

		await waitFor(() =>
			expect(error.current).toBeInstanceOf(NoTranslationsSet),
		);
	});
});

it("creates working hooks", async () => {
	const { setLocale, t, useLocale, useTranslations } = defineTranslationsConfig(
		translations,
		{ formatter, localeSource: ["en-GB"] },
	);

	const { rerender: rerenderLocale, result: locale } = renderHook(() =>
		useLocale(),
	);

	expect(locale.current).toBe("en-GB");

	const { result: translation } = renderHook(() =>
		useTranslations("some.deep"),
	);

	expect(translation.current).toBe(null);

	await waitFor(() =>
		expect(translation.current.string).toBe(enGB.default.some.deep.string),
	);

	setLocale("en-US");
	rerenderLocale();
	expect(locale.current).toBe("en-US");

	await waitFor(() =>
		expect(translation.current.string).toBe(enUS.default.some.deep.string),
	);

	setLocale("en-GB");
	rerenderLocale();
	expect(locale.current).toBe("en-GB");

	await waitFor(() =>
		expect(t(translation.current.string)).toBe(enGB.default.some.deep.string),
	);
});

it("creates working functions", async () => {
	const { getLocale, getTranslations, setLocale } = defineTranslationsConfig(
		translations,
		{
			formatter,
			localeSource: ["en-US"],
		},
	);

	expect(getLocale()).toBe("en-US");
	expect(await getTranslations("some")).toBe(enUS.default.some);

	setLocale("en-GB");

	expect(getLocale()).toBe("en-GB");
	expect(await getTranslations("some")).toBe(enGB.default.some);

	setLocale("en-US");

	expect(getLocale()).toBe("en-US");
	expect(await getTranslations("some")).toBe(enUS.default.some);
});
