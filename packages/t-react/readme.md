# t-react

> Seamless React integration for [`@wluwd/t`](https://github.com/wluwd/t) 🌐

## Install

Using your favorite package manager, install: `@wluwd/t-react @wluwd/t-utils`.

> [!NOTE]
> You're not required to install `@wluwd/t-utils`, but we recommend it as a helpful starting point for additional utilities and features.

The React adapter has two peer dependencies which you need to install: the first is `react` itself, the second is [`jotai`](https://jotai.org).

> [!NOTE]
> We will likely transition from Jotai to [Nano Stores](https://github.com/nanostores/nanostores) once [`use`](https://react.dev/reference/react/use) lands in a stable release.

## Usage

<!-- eslint-skip -->

```ts
// translations.ts
import { defineTranslationsConfig } from "@wluwd/t-react";
import { browser, lazyTranslations, formatter } from "@wluwd/t-utils";

export const {
	setLocale,
	getLocale,
	useLocale,
	getTranslations,
	useTranslations,
	t,
} = defineTranslationsConfig(
	{
		"en-US": lazyTranslations(() => import("./en-us.ts")),
		"it-IT": lazyTranslations(() => import("./it-it.ts")),
	},
	{
		formatter,
		localeFrom: [browser(), "en-US"],
	},
);
```

<!-- eslint-skip -->

```tsx
// article/published-by.tsx
import { useTranslations, t } from "../translations.ts";

const PublishedBy = ({ name }) => {
	const heading = useTranslations("article.heading");

	return <span>{t(heading.publishedBy, { name })}</span>;
};
```

## API

### `defineTranslationsConfig(loaders, options, lazy?)`

Creates the functions and hooks needed to localize your React application.

#### `loaders`

Extends: `Record<Locale, () => Promise<Translations>>`

An object whose keys will be used as the available locales and their values as loaders.

We recommend using the [UTS 35](https://www.unicode.org/reports/tr35/#Locale_Extension_Key_and_Type_Data) definition of Unicode Locale Identifier for keys as this allows an easier integration with [negotiators](#localefrom).

#### `options`

- ##### `formatter`

  Extends: `(translation: string, data: any) => string`

  A function that replaces placeholders within a string using values from `data`.

- ##### `localeFrom`

  Extends: `[] | [...LocaleNegotiator[], Locale]`

  An empty tuple, or a tuple with zero or more [`LocaleNegotiator`s](../t-utils) and, as the last element, one of `loaders`' keys.

  The negotiators are evaluated sequentially and the loop stops as soon as one returns a locale.

- ##### `cache`

  Extends: `Partial<Record<Locale, Translations>>`

  An object that can have `loaders`' keys and the **loaded** translations for that locale.

  Instead of loading the translations when one of these locales is active, the value from this object will be used.

#### `lazy`

Extends: `boolean | undefined`

When this is set to `true`, initiates the translator in _lazy mode_.

Alongside the other functions and hooks, `defineTranslationsConfig` will return an `init` function with the following signature:

<!-- eslint-skip -->

```ts
type Init = (negotiators?: LocaleNegotiators<Locale>) => void;
```

You **have to** call this function manually before using any of the other functions.

It's possible to pass a list of locale negotiators that will override the ones provided in `options`, if no negotiators are provided here, the ones provided in `options` will be used.

This is useful when a user's preferred locale comes from an HTTP request or a DB query.

---

Other than the `init` function described above, `defineTranslationsConfig` returns the following functions and hooks.

### `setLocale(locale)`

Sets the active locale to the provided one.

### `getLocale()`

A function that returns the active locale.

This function is not reactive and it's **not meant for use in _client_ components**.

### `useLocale()`

A hook that returns the active locale.

### `getTranslations(prefix)`

An `async` function that returns a slice of the active translations.

This function is not reactive and it's **not meant for use in _client_ components**.

### `useTranslations(prefix)`

A hook that returns a slice of the active translations.

This hook triggers a `Suspense`.

### `t(translation, data?)`

[`formatter`](#formatter), returned for convenience.
