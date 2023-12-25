# t

> A lightweight, unopinionated, framework-agnostic, and type-safe localization library 🌐

[![badge for the default branch's pipeline status](https://github.com/wluwd/t/actions/workflows/ci.yml/badge.svg?branch=trunk)](https://github.com/wluwd/t/actions/workflows/ci.yml)

## Features

- 📦 **Type-safety**: no generators needed when using TypeScript files; bidirectional reference search (`Go to Definition` and `Go to References` for each translation), autocomplete, mandatory placeholders, and more.
- 🦺 **Safe**: catch bugs early, it throws on common error scenarios like:
  - setting an unknown fallback locale;
  - using translations before a locale is set;
  - using translations after setting an unknown locale.
- 🫧 **Unopinionated:** we strive to offer the best experience possible when using our utilities, but you can bring your own:
  - formatter - so that you can write your translations in whatever format you like!
  - translations - as long as you provide types and a loader, they'll work!
- ✨ **No boilerplate**: start using this library with minimal effort.

## Getting Started

There's something important you need to know: `@wluwd/t` is a factory that provides a common interface and does the heavy lifting to provide working types. In most cases, you won't need to interact with this package directly; instead, you'll want to choose an **adapter** that suits your needs.

You have two options:

- #### Build Your Own Adapter

  If you have specific requirements or preferences, you can create a custom adapter. Check out the [documentation](packages/t) for guidance on building your own.

- #### Use an Official Adapter

  We provide official adapters to simplify the integration process. Choose an adapter that aligns with your project's needs.

  Here are the links to every adapter we maintain:

  - [`@wluwd/t-react`](packages/t-react)

> [!TIP]
> Thoroughly read the documentation for the selected adapter.

Here's a glimpse of what your code could look like:

<!-- eslint-skip -->

```ts
import { defineTranslationsConfig } from "@wluwd/t-[adapter]";
import { browser, lazyTranslations, formatter } from "@wluwd/t-utils";

export const { setLocale, useLocale, useTranslations, t } =
	defineTranslationsConfig(
		{
			"en-US": lazyTranslations(() => import("./en-us.ts")),
			"it-IT": lazyTranslations(() => import("./it-it.ts")),
		},
		{
			localeFrom: [browser(), "en-US"],
			formatter,
		},
	);
```

## Acknowledgements

- [Nano Stores i18n](https://github.com/nanostores/i18n) for inspiring the `cache`, `localeFrom`, and negotiator API.
- [fluent.js team](https://github.com/projectfluent/fluent.js) for providing an awesome locale negotiating algorithm.
