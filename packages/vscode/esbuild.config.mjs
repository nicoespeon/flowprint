import { build, context } from "esbuild";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes("--watch");

const buildOptions = {
	entryPoints: ["src/extension.ts"],
	bundle: true,
	platform: "node",
	target: "node20",
	format: "cjs",
	outfile: "dist/extension.js",
	external: ["vscode"],
	sourcemap: true,
	alias: {
		"@flowprint/core": resolve(__dirname, "../core/src/index.ts"),
	},
};

if (watch) {
	const ctx = await context(buildOptions);
	await ctx.watch();
	console.log("Watching for changes...");
} else {
	await build(buildOptions);
}
