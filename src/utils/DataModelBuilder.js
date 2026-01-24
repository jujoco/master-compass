/**
 * Cache for loaded view data
 */
const viewCache = {};

/**
 * Build a hierarchical data model from a view folder
 * @param {string} viewName - The view folder name
 * @returns {Promise<Object>} - The hierarchical data structure
 */
export async function buildFromView(viewName) {
	// Check cache first
	if (viewCache[viewName]) {
		return viewCache[viewName];
	}

	try {
		// Import the pre-generated data for this view
		const viewData = await import(`../generated/${viewName}.js`);
		const data = viewData.default || viewData;

		// Cache it
		viewCache[viewName] = data;

		return data;
	} catch (error) {
		console.error(`Failed to load view data for ${viewName}:`, error);
		throw new Error(
			`View "${viewName}" not found. ` +
				`Make sure the view exists in src/data/ and run the build to generate data models.`,
		);
	}
}
