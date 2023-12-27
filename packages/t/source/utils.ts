export const isKeyof = <Haystack extends object>(
	haystack: Haystack,
	needle: PropertyKey,
): needle is keyof Haystack => Reflect.has(haystack, needle);
