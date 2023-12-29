# t

> A lightweight, unopinionated, framework agnostic, and type-safe l10n library.

[![badge for the default branch's pipeline status](https://github.com/wluwd/t/actions/workflows/ci.yml/badge.svg?branch=trunk)](https://github.com/wluwd/t/actions/workflows/ci.yml)

## Features

- 📦 **Type-safety**: no generators needed when using TypeScript files; bidirectional reference search (`Go to Definition` and `Go to References` for each translation), autocomplete, mandatory placeholders, and more.
- 🦺 **Safe**: catch bugs early, it throws on common error scenarios like:
  - setting an unknown fallback locale;
  - using translations before a locale is set;
  - using translations after setting an unknown locale.
- 🌱 **Flexible:** bring your own translations - as long as you provide types and a loader, they'll work!
- ✨ **No boilerplate**: start using this library with minimal effort.

## Getting Started

There's something important you need to know: `@wluwd/t` is a factory that provides a common interface and does the heavy lifting to provide working types. In most cases, you won't need to interact with this package directly; instead, you'll want to choose an **adapter** that suits your needs.

You have two options:

- #### Build Your Own Adapter

  If you have specific requirements or preferences, you can create a custom adapter. Check out the [adapter documentation](https://github.com/wluwd/t/packages/t) for guidance on building your own.

- #### Use an Official Adapter

  We provide official adapters to simplify the integration process. Choose an adapter that aligns with your project's needs.

  Here are the links to every adapter we maintain:

  - [`@wluwd/t-react`](https://github.com/wluwd/t/packages/t-react)

> [!TIP]
> Thoroughly read the documentation for the selected adapter.

Once you've chosen an adapter, you can set up a minimal working configuration using the following example:

```ts
import { createTranslations } from "@wluwd/t-[adapter]";
import { browser, lazyTranslations, translator } from "@wluwd/t-utils";

export const { setLocale, useLocale, useTranslations, t } = createTranslations(
	{
		"en-US": lazyTranslations(() => import("./en-US.ts")),
		"it-IT": lazyTranslations(() => import("./it-IT.ts")),
	},
	{
		localeFrom: [browser, "en-US"],
		translator,
	},
);
```

## Acknowledgements

- [Nano Stores i18n](https://github.com/nanostores/i18n) for inspiring the `cache`, `localeFrom`, and negotiator API
- [fluent.js team](https://github.com/projectfluent/fluent.js) for providing an awesome locale negotiator algorithm
