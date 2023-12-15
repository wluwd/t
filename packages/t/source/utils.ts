export const isKeyof = <Haystack extends object>(
	haystack: Haystack,
	needle: number | string | symbol,
): needle is keyof Haystack => Reflect.has(haystack, needle);
