import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import antfu from "@antfu/eslint-config";
import configPrettier from "eslint-config-prettier";
import perfectionistNatural from "eslint-plugin-perfectionist/configs/recommended-natural";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default antfu(
	{
		stylistic: false,
		typescript: {
			tsconfigPath: [
				resolve(__dirname, "packages/**/tsconfig.json"),
				resolve(__dirname, "tsconfig.json"),
			],
		},
		// eslint-disable-next-line perfectionist/sort-objects
		rules: {
			...perfectionistNatural.rules,
			"import/order": "off",
			"perfectionist/sort-imports": [
				"error",
				{
					groups: [
						"builtin",
						["external", "internal", "parent", "sibling", "index"],
						[
							"type",
							"internal-type",
							"parent-type",
							"sibling-type",
							"index-type",
						],
						"style",
					],
				},
			],
			"perfectionist/sort-union-types": [
				"error",
				{
					"nullable-last": true,
					type: "natural",
				},
			],
			"ts/consistent-type-imports": [
				"error",
				{
					fixStyle: "separate-type-imports",
					prefer: "type-imports",
				},
			],
		},
	},
	configPrettier,
	{
		files: ["eslint.config.js"],
		// @info some plugins don't have the correct types yet
		rules: {
			"ts/no-unsafe-argument": "off",
			"ts/no-unsafe-assignment": "off",
			"ts/no-unsafe-member-access": "off",
		},
	},
	{
		files: ["package.json", "packages/*/package.json"],
		// @info keep pnpm default formatting
		rules: {
			"jsonc/comma-dangle": ["error", "never"],
			"jsonc/indent": ["error", 2],
		},
	},
);
