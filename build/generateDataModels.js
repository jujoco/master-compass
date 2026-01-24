import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Data Model Generator
 * @description Generates hierarchical data models from folder structure at build time
 *
 * This module scans the src/data/ directory structure using Node.js fs APIs and
 * generates static JSON files that can be imported by the client application.
 *
 * Folder Structure Conventions:
 * - Each folder becomes a node in the hierarchy
 * - Folder names become node names (hyphens converted to spaces)
 * - Leaf folders (no subfolders) get a default size property
 * - Optional _settings.js files can provide metadata for each node
 *
 * Required Settings Fields:
 * - name: Display name for the node
 * - description: Description of the node
 * - nodeColor: Color for this specific node (e.g., "#af4c91")
 *
 * Optional Settings Fields:
 * - size: Relative size for leaf nodes (default: 1000)
 * - owner: Team or person responsible
 * - contact: Email or Slack channel
 */

/**
 * Default configuration values
 */
const DEFAULTS = {
	LEAF_SIZE: 1000,
	NODE_COLOR: "#90CAF9", // Light blue default
};

/**
 * Generate all view data models
 * @param {string} dataDir - Path to the data directory
 * @param {string} outputDir - Path to output generated files
 * @returns {Promise<Object>} - Map of view names to their data
 */
export async function generateAll(dataDir, outputDir) {
	// Ensure output directory exists
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	// Scan for view directories
	const views = getViewDirectories(dataDir);
	const generatedViews = {};

	for (const viewName of views) {
		const viewPath = path.join(dataDir, viewName);
		const viewData = await buildFromDirectory(viewPath, viewName);
		generatedViews[viewName] = viewData;

		// Write individual view file as a JavaScript module
		const outputPath = path.join(outputDir, `${viewName}.js`);
		const jsContent = `export default ${JSON.stringify(viewData, null, 2)};\n`;
		fs.writeFileSync(outputPath, jsContent);
		console.log(`Generated: ${outputPath}`);
	}

	// Write combined index file as a JavaScript module
	const indexPath = path.join(outputDir, "index.js");
	const jsContent = `export default ${JSON.stringify(generatedViews, null, 2)};\n`;
	fs.writeFileSync(indexPath, jsContent);
	console.log(`Generated: ${indexPath}`);

	return generatedViews;
}

/**
 * Get all view directories
 * @param {string} dataDir - Path to the data directory
 * @returns {Array<string>} - Array of view directory names
 */
export function getViewDirectories(dataDir) {
	if (!fs.existsSync(dataDir)) {
		console.warn(`Data directory not found: ${dataDir}`);
		return [];
	}

	return fs
		.readdirSync(dataDir, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith("."))
		.map((dirent) => dirent.name)
		.sort();
}

/**
 * Build hierarchical data from a directory
 * @param {string} dirPath - Path to the directory
 * @param {string} nodeName - Name for the root node
 * @returns {Promise<Object>} - The hierarchical data structure
 */
async function buildFromDirectory(dirPath, nodeName) {
	// Load settings if available
	const settingsPath = path.join(dirPath, "_settings.js");
	let settings = {};

	if (fs.existsSync(settingsPath)) {
		try {
			// Dynamic import for ES modules with cache busting
			const settingsModule = await import(
				`file://${settingsPath}?t=${Date.now()}`
			);
			settings = settingsModule.default || {};
		} catch (error) {
			console.warn(
				`Failed to load settings from ${settingsPath}:`,
				error.message,
			);
		}
	}

	// Start with formatted folder name as default
	const node = {
		name: settings.name || formatNodeName(nodeName),
		description: settings.description || `${formatNodeName(nodeName)} segment`,
	};

	// Add nodeColor only if explicitly provided in settings
	if (settings.nodeColor) {
		node.nodeColor = settings.nodeColor;
	}

	// Merge any additional settings
	if (settings.owner) node.owner = settings.owner;
	if (settings.contact) node.contact = settings.contact;

	// Get subdirectories
	const subdirs = fs
		.readdirSync(dirPath, { withFileTypes: true })
		.filter(
			(dirent) =>
				dirent.isDirectory() &&
				!dirent.name.startsWith(".") &&
				dirent.name !== "node_modules",
		)
		.map((dirent) => dirent.name)
		.sort();

	if (subdirs.length === 0) {
		// Leaf node - add size property
		node.size = settings.size || DEFAULTS.LEAF_SIZE;
	} else {
		// Branch node - recursively process children
		node.children = [];

		for (const subdir of subdirs) {
			const childPath = path.join(dirPath, subdir);
			const childNode = await buildFromDirectory(childPath, subdir);
			node.children.push(childNode);
		}

		// Sort children by name for consistent ordering
		node.children.sort((a, b) => a.name.localeCompare(b.name));
	}

	return node;
}

/**
 * Format a folder name into a display name
 * Converts hyphens to spaces and capitalizes words
 * @param {string} folderName - The folder name
 * @returns {string} - Formatted display name
 */
function formatNodeName(folderName) {
	return folderName
		.replace(/-/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Run generator if executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
	const projectRoot = path.resolve(__dirname, "..");
	const dataDir = path.join(projectRoot, "src", "data");
	const outputDir = path.join(projectRoot, "src", "generated");

	console.log("Generating data models...");
	console.log(`Data directory: ${dataDir}`);
	console.log(`Output directory: ${outputDir}`);

	await generateAll(dataDir, outputDir);
	console.log("✓ Data generation complete!");
}
