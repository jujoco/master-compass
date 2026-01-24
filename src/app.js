import * as d3 from "d3";
import { marked } from "marked";
import { buildFromView } from "./utils/DataModelBuilder.js";
import { FloatingTooltip, getNodeStack } from "./utils/floating-tooltip.js";

/**
 * @class App
 * @description Main application class for organization visualization
 */
export default class App {
	static VIEW_FOLDER_MAPPING = {
		"view-1": "Product-Feature-View",
		"view-2": "Domain-Team-View",
	};

	/**
	 * @constructor
	 */
	constructor() {
		this.state = {
			focus: null,
			nodes: [],
			view: null,
			isZooming: false,
			currentView: "view-1",
		};

		this.dimensions = {
			width: 0,
			height: 0,
			diameter: 0,
			margin: 20,
		};

		this.d3Elements = {
			svg: null,
			g: null,
			circle: null,
			text: null,
			node: null,
			pack: null,
			color: null,
			tooltip: null,
		};
	}

	/**
	 * Initialize dimensions based on canvas size
	 */
	initializeDimensions() {
		const vizCanvas = document.querySelector(".viz-canvas");
		this.dimensions.width = vizCanvas.clientWidth;
		this.dimensions.height = vizCanvas.clientHeight;
		this.dimensions.diameter = Math.min(
			this.dimensions.width,
			this.dimensions.height,
		);
	}

	/**
	 * Setup SVG container and main group element
	 */
	setupSVG() {
		const { diameter } = this.dimensions;

		this.d3Elements.svg = d3.select(".viz-content");
		this.d3Elements.g = this.d3Elements.svg
			.append("g")
			.attr("transform", `translate(${diameter / 2}, ${diameter / 2})`);

		// Initialize tooltip attached to the SVG container
		const vizCanvas = document.querySelector(".viz-canvas");
		this.d3Elements.tooltip = new FloatingTooltip(vizCanvas);
	}

	/**
	 * Setup D3 scales for color and packing
	 */
	setupD3Scales() {
		const { diameter, margin } = this.dimensions;

		// Default gradient
		this.updateColorGradient();

		this.d3Elements.pack = d3
			.pack()
			.size([diameter - margin, diameter - margin])
			.padding(2);
	}

	/**
	 * Update color gradient based on focused node
	 * @param {Object} focusNode - The currently focused node (optional)
	 */
	updateColorGradient(focusNode = null) {
		const colorStart = "#a1d2fb"; // Light blue (default start)
		let colorEnd = "#1576bb"; // Dark blue (default end)

		// If focused node has a nodeColor, use it as the gradient end
		if (focusNode?.data.nodeColor) {
			colorEnd = focusNode.data.nodeColor;
		}

		this.d3Elements.color = d3
			.scaleSequential()
			.domain([-1, 2]) // Compressed domain for visible gradient with 1 layer depth
			.interpolator(d3.interpolateHcl(colorStart, colorEnd));
	}

	/**
	 * Load and render a specific view
	 * @param {string} viewType - The view type to load
	 */
	async loadView(viewType) {
		this.state.currentView = viewType;
		const folderName = App.VIEW_FOLDER_MAPPING[viewType];

		if (!folderName) {
			console.error(`Unknown view type: ${viewType}`);
			return;
		}

		// Clear existing visualization
		this.d3Elements.g.selectAll("*").remove();

		// Clear tooltip content
		if (this.d3Elements.tooltip) {
			this.d3Elements.tooltip.content(false);
		}

		try {
			// Dynamically build data from folder structure
			const data = await buildFromView(folderName);

			// Render the visualization
			this.renderVisualization(data);
		} catch (error) {
			console.error(`Failed to load view ${viewType}:`, error);
		}
	}

	/**
	 * Render the visualization with given data
	 * @param {Object} root - The root data object
	 */
	renderVisualization(root) {
		this.prepareHierarchy(root);
		this.renderCircles();
		this.renderTreeView();
		this.setupBackgroundZoom();
		this.setupResizeHandler();

		// Initial zoom to root (zoomed out for better overview)
		const { margin } = this.dimensions;
		this.zoomTo([
			this.state.focus.x,
			this.state.focus.y,
			(this.state.focus.r * 2 + margin) * 1.3, // Zoom out by 30%
		]);
	}

	/**
	 * Prepare hierarchy data and pack it
	 * @param {Object} root - The root data object
	 */
	prepareHierarchy(root) {
		const hierarchyRoot = d3
			.hierarchy(root)
			.sum((d) => d.size)
			.sort((a, b) => b.value - a.value);

		this.state.focus = hierarchyRoot;
		this.state.nodes = this.d3Elements.pack(hierarchyRoot).descendants();
	}

	/**
	 * Render hierarchical tree view in the info panel
	 */
	renderTreeView() {
		const treeContainer = d3.select("#treeView");
		if (treeContainer.empty()) return;

		// Clear existing tree
		treeContainer.html("");

		// Build tree starting from root
		const root = this.state.nodes[0];

		// Render tree recursively - start collapsed (only show first level)
		this.renderTreeNode(treeContainer, root, 0, true);
	}

	/**
	 * Render a single tree node recursively
	 * @param {Object} container - D3 selection of container
	 * @param {Object} node - Current node to render
	 * @param {number} depth - Current depth in the tree
	 * @param {boolean} expanded - Whether this node should start expanded
	 */
	renderTreeNode(container, node, depth, expanded = false) {
		// Create node container
		const nodeDiv = container.append("div").attr("class", "tree-node");

		// Add indentation
		nodeDiv
			.append("span")
			.attr("class", "tree-indent")
			.style("margin-left", `${depth * 20}px`);

		// Add expand/collapse indicator if node has children
		if (node.children && node.children.length > 0) {
			nodeDiv
				.append("span")
				.attr("class", "tree-icon")
				.text(expanded ? "▼" : "▶")
				.style("cursor", "pointer")
				.on("click", (event) => {
					event.stopPropagation();
					const icon = d3.select(event.target);
					const childrenContainer = d3.select(
						event.target.parentNode.nextSibling,
					);

					if (icon.text() === "▶") {
						icon.text("▼");
						childrenContainer.style("display", "block");
					} else {
						icon.text("▶");
						childrenContainer.style("display", "none");
					}
				});
		} else {
			nodeDiv.append("span").attr("class", "tree-icon").text("  ");
		}

		// Add node name (no click handler, no focus styling)
		nodeDiv.append("span").attr("class", "tree-label").text(node.data.name);

		// Render children if node has them
		if (node.children && node.children.length > 0) {
			const childrenContainer = container
				.append("div")
				.attr("class", "tree-children")
				.style("display", expanded ? "block" : "none");

			// Render all children recursively
			node.children.forEach((child) => {
				this.renderTreeNode(childrenContainer, child, depth + 1, false);
			});
		}
	}

	/**
	 * Render node groups (circles + labels)
	 */
	renderCircles() {
		const initialFocus = this.state.focus || this.state.nodes[0];

		// Create a group for each node
		this.d3Elements.node = this.d3Elements.g
			.selectAll("g.node-group")
			.data(this.state.nodes)
			.enter()
			.append("g")
			.attr("class", "node-group");

		// Add circles to each group
		this.d3Elements.circle = this.d3Elements.node
			.append("circle")
			.attr("class", (d) => {
				if (!d.parent) return "node node--root";
				return d.children ? "node" : "node node--leaf";
			})
			.style("fill", (d) => {
				// If node has a custom nodeColor, use it
				if (d.data.nodeColor) {
					return d.data.nodeColor;
				}
				// Otherwise, use depth-based gradient for all nodes
				return this.d3Elements.color(d.depth);
			})
			.style("opacity", (d) =>
				this.isNodeVisibleAtDepth(d, initialFocus) ? 1 : 0,
			)
			.style("pointer-events", (d) =>
				this.isNodeVisibleAtDepth(d, initialFocus) ? "auto" : "none",
			)
			.on("click", (event, d) => {
				// Don't zoom into leaf nodes
				if (this.state.focus !== d && d.children) {
					this.zoom(event, d);
					event.stopPropagation();
				}
			})
			.on("mouseover", (event, d) => {
				// Build breadcrumb path from root to current node
				const nodeStack = getNodeStack(d);
				const breadcrumb = nodeStack.map((node) => node.data.name).join(" → ");

				// Build tooltip content with breadcrumb and metadata
				let tooltipContent = `<div><strong>${breadcrumb}</strong></div>`;

				if (d.data.description) {
					tooltipContent += `<div style="margin-top: 5px;">${d.data.description}</div>`;
				}

				if (d.data.owner && d.data.owner !== "Unknown") {
					tooltipContent += `<div style="margin-top: 5px;"><em>Owner: ${d.data.owner}</em></div>`;
				}

				this.d3Elements.tooltip.content(tooltipContent);
			})
			.on("mouseout", () => {
				this.d3Elements.tooltip.content(false);
			});

		// Add labels to each group
		this.d3Elements.text = this.d3Elements.node
			.append("text")
			.attr("class", (d) => {
				if (!d.parent) return "label label--root";
				if (d === initialFocus && d.parent) return "label label--parent";
				return "label";
			})
			.attr("dy", (d) => {
				// Position label at top for root or focused parent node
				if (!d.parent || (d === initialFocus && d.parent)) {
					return -d.r + 25; // 25px from top edge
				}
				return "0.3em"; // Default center position for children
			})
			.style("fill-opacity", (d) => {
				// Show: root, focused node, or children of focused node
				if (!d.parent || d === initialFocus || d.parent === initialFocus)
					return 1;
				return 0;
			})
			.style("display", (d) => {
				// Show: root, focused node, or children of focused node
				if (!d.parent || d === initialFocus || d.parent === initialFocus)
					return "inline";
				return "none";
			})
			.text((d) => d.data.name);
	}

	/**
	 * Check if a node should be visible based on depth from focus
	 * @param {Object} node - The node to check
	 * @param {Object} focusNode - The currently focused node
	 * @returns {boolean} - Whether the node should be visible
	 */
	isNodeVisibleAtDepth(node, focusNode) {
		// Root is always visible
		if (!node.parent) return true;

		// Calculate depth relative to focus
		let depthFromFocus = 0;
		let currentNode = node;

		// Traverse up until we hit focus or root
		while (currentNode && currentNode !== focusNode) {
			currentNode = currentNode.parent;
			depthFromFocus++;
		}

		// If we hit the focus node, check if within 1 layer
		if (currentNode === focusNode) {
			return depthFromFocus <= 1;
		}

		// If focus is a descendant of this node, it should be visible
		currentNode = focusNode;
		while (currentNode && currentNode !== node) {
			currentNode = currentNode.parent;
		}

		return currentNode === node;
	}

	/**
	 * Setup background click to zoom out
	 */
	setupBackgroundZoom() {
		const root = this.state.nodes[0];

		this.d3Elements.svg
			.style("background", "#d0e8ff") // Light blue background
			.on("click", (event) => {
				this.zoom(event, root);
			});
	}

	/**
	 * Zoom to a specific node
	 * @param {Event} event - The triggering event
	 * @param {Object} d - The target node
	 */
	zoom(event, d) {
		this.state.isZooming = true;
		this.state.focus = d;

		const { margin, diameter } = this.dimensions;
		const v = [d.x, d.y, d.r * 2 + margin];

		// Update color gradient based on new focus
		this.updateColorGradient(d);

		const transition = d3
			.transition()
			.duration(event?.altKey ? 7500 : 750)
			.tween("zoom", () => {
				const i = d3.interpolateZoom(this.state.view, v);
				return (t) => this.zoomTo(i(t));
			})
			.on("end", () => {
				this.state.isZooming = false;
			});

		// Update visibility and colors of circles based on depth and focus
		transition
			.selectAll("circle")
			.style("opacity", (node) => (this.isNodeVisibleAtDepth(node, d) ? 1 : 0))
			.style("pointer-events", (node) =>
				this.isNodeVisibleAtDepth(node, d) ? "auto" : "none",
			)
			.style("fill", (node) => {
				// If node has a custom nodeColor, use it
				if (node.data.nodeColor) {
					return node.data.nodeColor;
				}
				// Otherwise, use depth-based gradient for all nodes
				return this.d3Elements.color(node.depth);
			});

		// Update label visibility and positioning for all nodes
		transition.selectAll("text.label").each(function (node) {
			const label = d3.select(this);
			// Show: root, focused node, or children of focused node
			const shouldShow = !node.parent || node === d || node.parent === d;
			const isParent = node === d && node.parent;
			const needsTopPosition = !node.parent || node === d;

			label
				.style("fill-opacity", shouldShow ? 1 : 0)
				.style("display", shouldShow ? "inline" : "none")
				.classed("label--parent", isParent)
				.attr("dy", () => {
					// Position label at top for root or focused node
					if (needsTopPosition) {
						const k = diameter / v[2];
						return -node.r * k + 25; // 25px from top edge
					}
					return "0.3em"; // Default center position for children
				});
		});
	}

	/**
	 * Apply zoom transformation
	 * @param {Array} v - The view parameters [x, y, radius]
	 */
	zoomTo(v) {
		const { diameter } = this.dimensions;
		const k = diameter / v[2];
		this.state.view = v;

		// Transform node groups (circles and labels move together)
		this.d3Elements.node.attr("transform", (d) => {
			return `translate(${(d.x - v[0]) * k}, ${(d.y - v[1]) * k})`;
		});

		// Update circle radii
		this.d3Elements.circle.attr("r", (d) => d.r * k);
	}

	/**
	 * Setup window resize handler
	 */
	setupResizeHandler() {
		const vizCanvas = document.querySelector(".viz-canvas");

		window.addEventListener("resize", () => {
			const newWidth = vizCanvas.clientWidth;
			const newHeight = vizCanvas.clientHeight;
			const newDiameter = Math.min(newWidth, newHeight);

			this.dimensions.diameter = newDiameter;
			this.d3Elements.pack.size([
				newDiameter - this.dimensions.margin,
				newDiameter - this.dimensions.margin,
			]);

			// Recalculate layout
			const currentFocusData = this.state.focus.data;
			const newRoot = d3
				.hierarchy(this.state.nodes[0].data)
				.sum((d) => d.size)
				.sort((a, b) => b.value - a.value);

			this.state.nodes = this.d3Elements.pack(newRoot).descendants();

			// Update node group data and rebind circles/text
			this.d3Elements.node.data(this.state.nodes);
			this.d3Elements.circle.data(this.state.nodes);
			this.d3Elements.text.data(this.state.nodes);

			// Update transform
			this.d3Elements.g.attr(
				"transform",
				`translate(${newDiameter / 2}, ${newDiameter / 2})`,
			);

			// Re-zoom to current focus
			if (this.state.focus) {
				const focusNode = this.state.nodes.find(
					(n) => n.data.name === currentFocusData.name,
				);
				if (focusNode) {
					this.state.focus = focusNode;
					this.zoomTo([
						focusNode.x,
						focusNode.y,
						focusNode.r * 2 + this.dimensions.margin,
					]);
				}
			}
		});
	}

	/**
	 * Setup tab switching event handlers
	 */
	setupTabHandlers() {
		document.querySelectorAll(".tab").forEach((tab) => {
			tab.addEventListener("click", async (event) => {
				// Update active tab
				document.querySelectorAll(".tab").forEach((t) => {
					t.classList.remove("active");
				});
				event.currentTarget.classList.add("active");

				// Load the selected view
				const viewType = event.currentTarget.getAttribute("data-view");
				await this.loadView(viewType);
			});
		});
	}

	/**
	 * Setup documentation link handler
	 */
	setupDocumentationHandler() {
		const viewDocsLink = document.getElementById("viewDocsLink");
		if (viewDocsLink) {
			viewDocsLink.addEventListener("click", async (event) => {
				event.preventDefault();
				await this.showDocumentation();
			});
		}
	}

	/**
	 * Show the documentation view
	 */
	async showDocumentation() {
		const infoPanel = document.querySelector(".info-panel");
		if (!infoPanel) return;

		try {
			// Fetch the README.md file
			const response = await fetch("/README.md");
			const markdown = await response.text();

			// Convert markdown to HTML
			const htmlContent = marked.parse(markdown);

			// Save the current content
			const currentContent = infoPanel.innerHTML;

			// Create documentation view
			const docView = document.createElement("div");
			docView.className = "documentation-view";
			docView.innerHTML = `
				<button class="back-button" id="backToMainView">← Back to Main View</button>
				<div class="markdown-content">
					${htmlContent}
				</div>
			`;

			// Replace panel content
			infoPanel.innerHTML = "";
			infoPanel.appendChild(docView);

			// Setup back button
			const backButton = document.getElementById("backToMainView");
			if (backButton) {
				backButton.addEventListener("click", () => {
					infoPanel.innerHTML = currentContent;
					// Re-setup documentation handler after restoring content
					this.setupDocumentationHandler();
					// Re-render tree view
					this.renderTreeView();
				});
			}
		} catch (error) {
			console.error("Failed to load documentation:", error);
		}
	}

	/**
	 * Setup all event listeners
	 */
	setupEventListeners() {
		this.setupTabHandlers();
		this.setupDocumentationHandler();
	}

	/**
	 * Main render method - orchestrates the entire visualization
	 * @returns {Promise<void>}
	 */
	async render() {
		this.initializeDimensions();
		this.setupSVG();
		this.setupD3Scales();
		this.setupEventListeners();
		await this.loadView("view-1");
	}
}
