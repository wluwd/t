import { defineConfig } from "tsup";

export default defineConfig({
	dts: true,
	entry: [
		"source/error.ts",
		"source/lazy-translations.ts",
		"source/negotiator.ts",
		"source/translator.ts",
	],
	format: "esm",
	outDir: "dist",
});
