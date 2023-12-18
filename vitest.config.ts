import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["tests/*.spec.ts?(x)"],
		onConsoleLog: (_, type) => {
			if (type === "stderr") {
				return false;
			}
		},
	},
});
