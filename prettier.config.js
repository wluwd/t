/** @type {import("prettier").Config} */
export default {
	overrides: [
		{
			files: [".vscode/*.json", "tsconfig.*.json", "tsconfig.json"],
			options: {
				parser: "json5",
				quoteProps: "preserve",
				trailingComma: "all",
			},
		},
	],
	useTabs: true,
};
