import { atom, onMount } from "nanostores";

import type { LazyLoader } from "@wluwd/t-utils";
import type { ReadableAtom, StoreValue } from "nanostores";
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

interface Ref<T> {
	current: T;
}

const untilNotStale = (
	currentPromise: Ref<Promise<unknown>>,
	activePromise: Promise<unknown>,
): unknown =>
	activePromise.then((arg) =>
		currentPromise.current === activePromise
			? arg
			: untilNotStale(currentPromise, currentPromise.current),
	);

const initialPromise = Promise.resolve();

type StoresToValues<Stores extends readonly ReadableAtom[]> = {
	[k in keyof Stores]: StoreValue<Stores[k]>;
};

export const computed = <
	const Stores extends readonly ReadableAtom<unknown>[],
	Computed extends (...args: StoresToValues<Stores>) => unknown,
>(
	stores: Stores,
	cb: Computed,
): ReadableAtom<ReturnType<Computed>> => {
	const $computed = atom(undefined);

	let previousArgs: StoresToValues<Stores>;
	const previousPromise = { current: initialPromise } as Ref<Promise<unknown>>;

	const set = () => {
		const args = stores.map(($store) => $store.get()) as StoresToValues<Stores>;

		if (
			previousArgs === undefined ||
			args.some((arg, i) => arg !== previousArgs[i])
		) {
			previousArgs = args;
			const value = cb(...args);

			if (value instanceof Promise) {
				previousPromise.current = value;
				$computed.set(<never>untilNotStale(previousPromise, value));
			} else {
				$computed.set(<never>value);
			}
		}
	};

	onMount($computed, () => {
		const unbinds = stores.map(($store) => $store.listen(set));

		set();

		return () => {
			for (const unbind of unbinds) {
				unbind();
			}
		};
	});

	return <never>$computed;
};
