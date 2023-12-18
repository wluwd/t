export {
	NoLocaleSet,
	NoTranslationsSet,
	UnknownDefaultLocale,
	UnknownDefaultLocaleStrategy,
	createTranslationsFactory,
} from "~/factory.ts";
export type {
	CreateTranslationsFactoryOptions,
	GetLocaleHook,
	GetTranslationsHook,
	LazyLoader,
	SetLocale,
} from "~/factory.ts";

export { t } from "~/translator.ts";
export type { Translator } from "~/translator.ts";
