import { computed, isKeyof } from "~/utils.ts";
import { atom } from "nanostores";
import { describe, expect, it } from "vitest";

describe("`isKeyof`", () => {
	it("should return `true` when `needle` is keyof `haystack`", () => {
		expect(isKeyof({ key: "string" }, "key")).toBe(true);
	});

	it("should return `false` when `needle` is not keyof `haystack`", () => {
		expect(isKeyof({ key: "string" }, "unknown")).toBe(false);
	});
});

describe("`eagerComputed`", () => {
	it("works", () => {
		const VALUES = [Number.NaN, "string"] as const;
		const NEW_VALUES = [Number.NEGATIVE_INFINITY, "string"] as const;

		const $atomNumber = atom(VALUES[0]);
		const $atomString = atom(VALUES[1]);

		const $computed = computed([$atomNumber, $atomString], (number, string) => [
			number,
			string,
		]);

		expect($computed.get()).toEqual(VALUES);

		$atomNumber.set(NEW_VALUES[0]);

		expect($computed.get()).toEqual(NEW_VALUES);
	});

	it("resolves promises", async () => {
		const VALUES = [Number.NaN, "string"] as const;
		const NEW_VALUES = [Number.NEGATIVE_INFINITY, "string"] as const;

		const $atomNumber = atom(VALUES[0]);
		const $atomString = atom(VALUES[1]);

		const $computed = computed([$atomNumber, $atomString], (number, string) =>
			Promise.resolve([number, string]),
		);

		expect($computed.get()).toEqual(expect.any(Promise));
		expect(await $computed.get()).toEqual(VALUES);

		$atomNumber.set(NEW_VALUES[0]);

		expect(await $computed.get()).toEqual(NEW_VALUES);
	});

	it("resolves to the last promise", async () => {
		const LONG_SLEEP = 50;
		const MEDIUM_SLEEP = 30;
		const SHORT_SLEEP = 10;

		const PROMISES: Promise<number>[] = [];

		const $atomSleep = atom(LONG_SLEEP);

		const $computed = computed([$atomSleep], (sleep) => {
			const promise = new Promise<number>((resolve) => {
				setTimeout(() => resolve(sleep), sleep);
			});

			PROMISES.push(promise.then(() => performance.now()));

			return promise;
		});

		let promise = $computed.get();

		$atomSleep.set(MEDIUM_SLEEP);

		expect(await promise).toEqual(MEDIUM_SLEEP);
		expect(PROMISES.length).toBe(2);

		$atomSleep.set(SHORT_SLEEP);

		promise = $computed.get();

		$atomSleep.set(LONG_SLEEP);

		expect(await promise).toEqual(LONG_SLEEP);
		expect(PROMISES.length).toBe(4);
	});
});
