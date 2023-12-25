# t-utils

> Smart utilities that turn translation challenges into smooth solutions ❤️‍🔥

## Install

Using your favorite package manager, install: `@wluwd/t-utils`.

## API

### `formatter(translation, data?)`

Generates a formatted string by replacing placeholders with values from the provided `data`.

Placeholders, denoted by `{{` and `}}`, indicate the locations where replacement will occur. The content within the curly braces must correspond to a mandatory key in the `data` object.

**Example:**

<!-- eslint-skip -->

```ts
const translation = "Hello, {{name}}! Welcome to {{city}}.";
const data = {
	name: "John",
	city: "New York",
};

formatter(translation, data); // -> "Hello, John! Welcome to New York."
```

### `lazyTranslations(loader)`

Lazy loads translations using the provided loader function and returns the `default` import value.

The loader function should be an asynchronous function that imports a translation module and returns a promise. The `default` import of the module is then returned by `lazyTranslations` once it's resolved.

**Example:**

<!-- eslint-skip -->

```ts
lazyTranslations(async () => ({
	default: {
		some: "string",
	},
})); // -> Promise<{ some: "string" }>;
```

### `browser()`

A locale negotiator that automatically uses the browser's preferred languages obtained from `navigator.languages`.

This negotiator is useful for scenarios where you want to set the default locale based on the user's browser language preferences.

**Example:**

<!-- eslint-skip -->

```ts
import { defineTranslationsConfig } from "@wluwd/t-[adapter]";
import { browser } from "@wluwd/t-utils";

defineTranslationsConfig(
	{
		// loaders
	},
	{
		localeFrom: [
			browser(),
			// fallback locale
		],
		// ... other options
	},
);
```
