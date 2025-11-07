import { defineConfig } from "tsdown";

export default defineConfig([
	{
		entry: "src/index.ts",
		name: "grandi",
		shims: true,
		sourcemap: true,
	},
	{
		entry: ["src/download.ts"],
		outDir: "dist",
		dts: false,
	},
]);
