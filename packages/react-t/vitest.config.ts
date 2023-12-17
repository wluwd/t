import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import defaultConfig from "../../vitest.config.ts";
import { mergeConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default mergeConfig(
	defaultConfig,
	{
		resolve: {
			alias: {
				"~": resolve(__dirname, "source"),
			},
		},
	},
	true,
);
