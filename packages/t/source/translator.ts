import type { UnionToIntersection } from "type-fest";

type ExtractArguments<
	Haystack extends string,
	Needles extends string[] = [],
> = Haystack extends `${string}{{${infer Needle}}}${infer Tail}`
	? ExtractArguments<Tail, [...Needles, Needle]>
	: Needles extends []
		? never
		: UnionToIntersection<{
				[k in Needles[number]]: string;
			}>;

export type Translator = <
	Translation extends string,
	Data extends ExtractArguments<Translation>,
>(
	translation: Translation,
	...[data]: [Data] extends [never] ? [data?: undefined] : [data: Data]
) => string;

export const t: Translator = (translation, ...[data]) =>
	translation?.replace(
		/{{(\w+)}}/g,
		(_rawMatch, property: string) =>
			(data && Reflect.get(data, property)?.toString()) ??
			`[\`${property}\` was not provided]`,
	);
