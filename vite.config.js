import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import dataGeneratorPlugin from "./build/vite-plugin-data-generator.js";

// Simple plugin to copy README.md to dist during build
function copyReadmePlugin() {
	return {
		name: "copy-readme",
		closeBundle() {
			const src = resolve("README.md");
			const dest = resolve("dist/README.md");
			copyFileSync(src, dest);
			console.log("✓ Copied README.md to dist");
		},
	};
}

export default defineConfig({
	plugins: [
		// Generate data models from directory structure at build time
		dataGeneratorPlugin({
			dataDir: "src/data",
			outputDir: "src/generated",
		}),
		// Copy README.md to dist for documentation view
		copyReadmePlugin(),
	],

	// Ensure generated files are not excluded from the build
	assetsInclude: ["**/*.json"],

	// Optimize build output
	build: {
		target: "esnext",
		minify: "esbuild",
		sourcemap: true,
	},

	// Configure dev server
	server: {
		port: 3000,
		open: true,
	},
});
