import path from "node:path";
import { generateAll, getViewDirectories } from "./generateDataModels.js";

/**
 * Vite plugin to generate data models at build time
 *
 * This plugin runs during both dev and build modes:
 * - In dev mode: Generates data on startup and watches for changes
 * - In build mode: Generates data before bundling
 *
 * @param {Object} options - Plugin options
 * @param {string} options.dataDir - Path to data directory (relative to project root)
 * @param {string} options.outputDir - Path to output directory (relative to project root)
 * @returns {import('vite').Plugin}
 */
export default function dataGeneratorPlugin(options = {}) {
	const { dataDir = "src/data", outputDir = "src/generated" } = options;

	let projectRoot;
	let absoluteDataDir;
	let absoluteOutputDir;

	return {
		name: "vite-plugin-data-generator",

		/**
		 * Called when Vite config is resolved
		 */
		configResolved(config) {
			projectRoot = config.root;
			absoluteDataDir = path.resolve(projectRoot, dataDir);
			absoluteOutputDir = path.resolve(projectRoot, outputDir);
		},

		/**
		 * Called when dev server starts or before build
		 */
		async buildStart() {
			console.log("\n🔨 Generating data models from directory structure...");

			try {
				await generateAll(absoluteDataDir, absoluteOutputDir);
				console.log("✓ Data models generated successfully\n");
			} catch (error) {
				console.error("Failed to generate data models:", error);
				throw error;
			}
		},

		/**
		 * Configure the dev server to watch for changes in data directory
		 */
		configureServer(server) {
			// Watch the data directory for changes
			server.watcher.add(path.join(absoluteDataDir, "**/*"));

			// Ignore changes to generated files to prevent immediate HMR triggers
			const ignoredPath = path.join(absoluteOutputDir, "**/*");
			if (server.watcher.options.ignored) {
				if (Array.isArray(server.watcher.options.ignored)) {
					server.watcher.options.ignored.push(ignoredPath);
				} else {
					server.watcher.options.ignored = [
						server.watcher.options.ignored,
						ignoredPath,
					];
				}
			} else {
				server.watcher.options.ignored = [ignoredPath];
			}

			server.watcher.on("change", async (filePath) => {
				// Only regenerate if the change is in the data directory
				if (filePath.startsWith(absoluteDataDir)) {
					console.log("\n📁 Data directory changed, regenerating models...");

					try {
						await generateAll(absoluteDataDir, absoluteOutputDir);
						console.log("✓ Data models regenerated\n");

						// Invalidate all generated modules in Vite's module graph
						const modulesToInvalidate = [
							path.join(absoluteOutputDir, "index.js"),
						];

						// Also invalidate individual view modules
						const views = getViewDirectories(absoluteDataDir);
						views.forEach((viewName) => {
							modulesToInvalidate.push(
								path.join(absoluteOutputDir, `${viewName}.js`),
							);
						});

						// Invalidate each module
						modulesToInvalidate.forEach((modulePath) => {
							const module = server.moduleGraph.getModuleById(modulePath);
							if (module) {
								server.moduleGraph.invalidateModule(module);
							}
						});

						// Trigger full reload after invalidation
						setTimeout(() => {
							server.ws.send({
								type: "full-reload",
								path: "*",
							});
						}, 100);
					} catch (error) {
						console.error("Failed to regenerate data models:", error);
					}
				}
			});
		},
	};
}
