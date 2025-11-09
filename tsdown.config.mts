import { defineConfig } from "tsdown";

export default defineConfig([
	{
		entry: "src/index.ts",
		name: "grandi",
		shims: true,
		sourcemap: true,
	},
]);
