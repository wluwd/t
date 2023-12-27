export type AnyTranslations = Record<string, unknown>;
export type LazyLoader<Return = AnyTranslations> = () => Promise<Return>;

type LazyFactory = <Return extends AnyTranslations>(
	factory: () => Promise<{ default: Return }>,
) => LazyLoader<Return>;

export const lazyTranslations: LazyFactory = (factory) => () =>
	factory().then((t) => t.default);
