import { build } from "esbuild";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

await build({
	entryPoints: ["src/index.ts"],
	bundle: true,
	platform: "node",
	target: "node20",
	format: "esm",
	outfile: "dist/index.js",
	external: ["ts-morph"],
	banner: { js: "#!/usr/bin/env node" },
	alias: {
		"@flowprint/core": resolve(__dirname, "../core/src/index.ts"),
	},
});
