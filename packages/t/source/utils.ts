import type { LazyLoader } from "@wluwd/t-utils";
import type { Simplify } from "type-fest";

export const isKeyof = <Haystack extends object>(
	haystack: Haystack,
	needle: PropertyKey,
): needle is keyof Haystack => Reflect.has(haystack, needle);

export type ConcatKeys<
	Previous extends string,
	New extends string,
> = Previous extends "" ? New : `${Previous}.${New}`;

export type PathsToBranches<
	Branch extends Record<string, unknown>,
	KeysFound extends string = "",
> = Simplify<
	{
		[K in keyof Branch & string]: Branch[K] extends Record<string, unknown>
			?
					| ConcatKeys<KeysFound, K>
					| PathsToBranches<Branch[K], ConcatKeys<KeysFound, K>>
			: KeysFound;
	}[keyof Branch & string]
> &
	string;

export type AnyFunction = (...args: any) => any;
export type AnyFormatter = (translation: any, data: any) => string;

export type NamedFactory<Fn extends AnyFunction> = readonly [string, Fn];

export type FromNamedFactory<
	Factory extends NamedFactory<any> | undefined,
	TypedFactory extends NamedFactory<any> | undefined,
> = Factory extends NamedFactory<any>
	? TypedFactory extends NamedFactory<any>
		? {
				[key in Factory[0]]: ReturnType<TypedFactory[1]>;
			}
		: object
	: object;

export type ExtractTranslations<Loaders extends Record<string, LazyLoader>> = {
	[key in keyof Loaders & string]: Awaited<ReturnType<Loaders[key]>>;
};
