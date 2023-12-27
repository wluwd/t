export const lazyTranslations =
	<T extends Record<string, unknown>>(loader: () => Promise<{ default: T }>) =>
	() =>
		loader().then((t) => t.default);
