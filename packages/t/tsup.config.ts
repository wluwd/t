import { defineConfig } from "tsup";

export default defineConfig({
	dts: true,
	entry: ["source/index.ts"],
	format: "esm",
	outDir: "dist",
});
