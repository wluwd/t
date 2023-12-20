import { renderHook, waitFor } from "@testing-library/react";
import {
	NoLocaleSet,
	NoTranslationsSet,
	createTranslations,
	lazyTranslations,
} from "~/index.ts";
import { Component } from "react";
import { describe, expect, it } from "vitest";

import type { ReactNode } from "react";

const nextTick = () => Promise.resolve();

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
		const { useLocale, useTranslations } = createTranslations(translations);

		const { result: locale } = renderHook(() => useLocale());
		expect(locale.current).toBe(undefined);

		const error = { current: undefined };
		const { rerender } = renderHook(() => useTranslations("some.deep"), {
			wrapper: ({ children }) => (
				<ErrorBoundary error={error}>{children}</ErrorBoundary>
			),
		});

		await nextTick();
		rerender();

		expect(error.current).toBeInstanceOf(NoLocaleSet);
	});

	it("`NoTranslationsSet` when trying to load translations that have no loader", async () => {
		const { setLocale, useLocale, useTranslations } =
			createTranslations(translations);

		const { result: locale } = renderHook(() => useLocale());
		expect(locale.current).toBe(undefined);

		const error = { current: undefined };
		const { rerender } = renderHook(() => useTranslations("some.deep"), {
			wrapper: ({ children }) => (
				<ErrorBoundary error={error}>{children}</ErrorBoundary>
			),
		});

		// @ts-expect-error testing undefined translations
		setLocale("en-AU");

		await nextTick();
		rerender();

		expect(error.current).toBeInstanceOf(NoTranslationsSet);
	});
});

it("creates a working `createTranslations`", async () => {
	const { setLocale, t, useLocale, useTranslations } = createTranslations(
		translations,
		"en-GB",
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

describe("`defaultLocale` strategies", () => {
	it("`auto` picks up the correct locale", async () => {
		// @info statically set by happy-dom, should never fail
		expect(navigator.languages).toEqual(["en-US", "en"]);

		const { useLocale } = createTranslations(translations, ["auto", "en-GB"]);

		const { result: locale } = renderHook(() => useLocale());

		expect(locale.current).toBe("en-US");
	});
});
