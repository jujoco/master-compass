import * as d3 from "d3";

/**
 * FloatingTooltip - A lightweight tooltip that follows the mouse cursor
 * Recreates float-tooltip functionality using only D3, without Kapsule framework
 *
 * NOTE: Requires importing the CSS file in your application:
 * import './styles/floating-tooltip.css';
 *
 * @example
 * const tooltip = new FloatingTooltip(containerElement, { style: { fontSize: '14px' } });
 * tooltip.content('<div>Tooltip text</div>');
 * tooltip.offsetX(10);
 * tooltip.offsetY(-20);
 * tooltip.destroy();
 */
export class FloatingTooltip {
	constructor(domNode, { style = {} } = {}) {
		// Support both DOM element and D3 selection (same as original)
		const isD3Selection =
			!!domNode &&
			typeof domNode === "object" &&
			!!domNode.node &&
			typeof domNode.node === "function";

		const el = d3.select(isD3Selection ? domNode.node() : domNode);

		// Internal state
		this.state = {
			el,
			tooltipEl: null,
			mouseInside: false,
			content: false,
			offsetX: undefined,
			offsetY: undefined,
			evSuffix: `tooltip-${Math.round(Math.random() * 1e12)}`,
		};

		this._init(style);
	}

	_init(style) {
		const { el, evSuffix } = this.state;

		// Make sure container is positioned to provide anchor for tooltip
		if (el.style("position") === "static") {
			el.style("position", "relative");
		}

		// Create tooltip element
		this.state.tooltipEl = el.append("div").attr("class", "floating-tooltip");

		// Apply custom style overrides
		Object.entries(style).forEach(([k, v]) => {
			this.state.tooltipEl.style(k, v);
		});

		// Start off-screen
		this.state.tooltipEl.style("left", "-10000px").style("display", "none");

		// Mousemove handler
		el.on(`mousemove.${evSuffix}`, (ev) => {
			this.state.mouseInside = true;

			const mousePos = d3.pointer(ev);

			const domNode = el.node();
			const canvasWidth = domNode.offsetWidth;
			const canvasHeight = domNode.offsetHeight;

			// Calculate translate values (matching original exactly)
			const translate = [
				this.state.offsetX === null || this.state.offsetX === undefined
					? // auto: adjust horizontal position to not exceed canvas boundaries
						`-${(mousePos[0] / canvasWidth) * 100}%`
					: typeof this.state.offsetX === "number"
						? `calc(-50% + ${this.state.offsetX}px)`
						: this.state.offsetX,
				this.state.offsetY === null || this.state.offsetY === undefined
					? // auto: flip to above if near bottom
						canvasHeight > 130 && canvasHeight - mousePos[1] < 100
						? "calc(-100% - 6px)"
						: "21px"
					: typeof this.state.offsetY === "number"
						? this.state.offsetY < 0
							? `calc(-100% - ${Math.abs(this.state.offsetY)}px)`
							: `${this.state.offsetY}px`
						: this.state.offsetY,
			];

			this.state.tooltipEl
				.style("left", `${mousePos[0]}px`)
				.style("top", `${mousePos[1]}px`)
				.style("transform", `translate(${translate.join(",")})`);

			if (this.state.content) {
				this.state.tooltipEl.style("display", "inline");
			}
		});

		// Mouseover handler
		el.on(`mouseover.${evSuffix}`, () => {
			this.state.mouseInside = true;
			if (this.state.content) {
				this.state.tooltipEl.style("display", "inline");
			}
		});

		// Mouseout handler
		el.on(`mouseout.${evSuffix}`, () => {
			this.state.mouseInside = false;
			this.state.tooltipEl.style("display", "none");
		});
	}

	/**
	 * Update tooltip display based on content and mouse state
	 */
	_update() {
		this.state.tooltipEl.style(
			"display",
			!!this.state.content && this.state.mouseInside ? "inline" : "none",
		);

		if (!this.state.content) {
			this.state.tooltipEl.text("");
		} else if (this.state.content instanceof HTMLElement) {
			this.state.tooltipEl.text(""); // empty it
			this.state.tooltipEl.append(() => this.state.content);
		} else if (typeof this.state.content === "string") {
			this.state.tooltipEl.html(this.state.content);
		} else {
			this.state.tooltipEl.style("display", "none");
			console.warn(
				"Tooltip content is invalid, skipping.",
				this.state.content,
				this.state.content.toString(),
			);
		}
	}

	/**
	 * Get or set tooltip content
	 * @param {string|HTMLElement|false|null} val - Content to display
	 * @returns {FloatingTooltip|string|HTMLElement|false} Current value or this for chaining
	 */
	content(...args) {
		if (args.length === 0) {
			return this.state.content;
		}
		const [val] = args;
		this.state.content = val;
		this._update();
		return this;
	}

	/**
	 * Get or set X offset
	 * @param {number|string|null} val - Offset value
	 * @returns {FloatingTooltip|number|string|null} Current value or this for chaining
	 */
	offsetX(...args) {
		if (args.length === 0) {
			return this.state.offsetX;
		}
		const [val] = args;
		this.state.offsetX = val;
		return this;
	}

	/**
	 * Get or set Y offset
	 * @param {number|string|null} val - Offset value
	 * @returns {FloatingTooltip|number|string|null} Current value or this for chaining
	 */
	offsetY(...args) {
		if (args.length === 0) {
			return this.state.offsetY;
		}
		const [val] = args;
		this.state.offsetY = val;
		return this;
	}

	/**
	 * Clean up event listeners and remove tooltip element
	 */
	destroy() {
		const { el, evSuffix, tooltipEl } = this.state;

		// Remove event listeners
		el.on(`mousemove.${evSuffix}`, null);
		el.on(`mouseover.${evSuffix}`, null);
		el.on(`mouseout.${evSuffix}`, null);

		// Remove tooltip element
		if (tooltipEl) {
			tooltipEl.remove();
		}
	}
}

/**
 * Helper function to build a node stack (hierarchy path) for D3 hierarchical data
 * Useful for displaying breadcrumb-style tooltips showing the full path from root to current node
 *
 * @param {Object} node - D3 hierarchy node with parent reference
 * @returns {Array} Array of nodes from root to current node
 *
 * @example
 * const path = getNodeStack(currentNode);
 * const breadcrumb = path.map(d => d.data.name).join(' → ');
 * tooltip.content(`<div>${breadcrumb}</div>`);
 */
export function getNodeStack(node) {
	const stack = [];
	let curNode = node;
	while (curNode) {
		stack.unshift(curNode);
		curNode = curNode.parent;
	}
	return stack;
}
