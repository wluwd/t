import { defineConfig } from "tsup";

export default defineConfig({
	dts: true,
	entry: ["source/negotiator.ts"],
	format: "esm",
	outDir: "dist",
});
