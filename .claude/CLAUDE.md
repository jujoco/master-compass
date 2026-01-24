# Master Compass - Project Overview

## Purpose
An interactive organizational navigation tool that makes ownership visible and accountability clear. Built to end the blame game when applications break and help teams understand who owns what across their organization.

**Fully customizable** - Design your own hierarchies and views to match your organization's structure, whether it's product-centric, team-based, technology stacks, or any other perspective that matters to you.

## Architecture

### Technology Stack
- **Framework**: Vanilla JavaScript + Vite as the build tool
- **Visualization**: D3.js for circle-packing hierarchical visualizations
- **Styling**: CSS modules with depth-based color gradients
- **Data Source**: File-system based - folder structure in `/src/data` drives the visualization hierarchy
- **Build Process**: Data is generated at build time from the folder structure

### Key Architectural Decisions
1. **Folder structure IS the data structure** - Each folder in `/src/data` becomes a node in the visualization
2. **Automatic name formatting** - Folder names are automatically formatted (hyphens → spaces, title case) for display
3. **Multiple views** - Different organizational perspectives are stored as separate folder hierarchies - **you define what views make sense for your organization**
4. **Build-time data generation** - A Vite plugin (`build/vite-plugin-data-generator.js`) runs `build/generateDataModels.js` to process folder structure into JSON during dev and build
5. **Required `_settings.js` files** - Each directory must contain at least one file for Git tracking
   - **Critical:** Git doesn't track empty directories - they disappear on deployment (Vercel, etc.)
   - **Minimum:** `export default {};` in every directory to ensure Git tracking
   - All fields in `_settings.js` are optional (name, description, nodeColor, owner, contact)
   - The `name` property should only be used when special formatting is needed (e.g., `"Time & Attendance"` instead of auto-formatted `"Time And Attendance"`)
   - Most nodes only need a `description` field

### Example Views (Customize for Your Needs)
The included examples show possible organizational perspectives. Replace these with views that match your organization:

1. **Product-Feature View** (Example)
   - Hierarchy: Client Segments → Products/Features
   - Structure: Enterprise-Clients/Small-Size-Clients → Products (Payments, Terminal, Checkout, etc.)
   - Shows product portfolio organized by customer segment
   - See `/src/data/Product-Feature-View/` for the complete structure

2. **Domain-Team View** (Example)
   - Hierarchy: Client Segments → Geographic Regions → Specialized Teams
   - Structure: Client Types → Regions (EU/US/CA) → Teams (QA, DB, Security, Performance, Ops)
   - Shows functional team distribution across geographic regions
   - See `/src/data/Domain-Team-View/` for the complete structure

**Create your own views** by adding folders to `/src/data/` with any hierarchy that makes sense for your organization:
- Technology stack view (Frontend → Backend → Infrastructure)
- Service ownership view (Microservices → Teams → On-call contacts)
- Platform view (Platform → Components → APIs)
- Business domain view (Domains → Capabilities → Systems)

### Data Directory Structure
```
/src/data/
├── [View-Name-1]/            # Your first organizational view
│   └── [folders represent nodes in hierarchy]
├── [View-Name-2]/            # Your second organizational view
│   └── [folders represent nodes in hierarchy]
└── [View-Name-N]/            # Add as many views as needed
    └── [folders represent nodes in hierarchy]
```

### How It Works
1. User selects a view (tabs at top)
2. Clicks circles to drill down through hierarchy
3. Breadcrumb navigation to move back up
4. Hover to see ownership and metadata
5. Circle size represents relative importance/complexity

### How _settings.js Files Work
The build script (`build/generateDataModels.js`) processes each folder:
1. Scans directories using Node.js `fs` APIs (works with empty folders)
2. Dynamically imports `_settings.js` files as ES modules with cache-busting
3. Applies fallback logic for missing properties:
   - `name`: Uses `formatNodeName(folderName)` which converts hyphens to spaces and title-cases
   - `description`: Defaults to `"[Name] segment"`
   - `nodeColor`: Only added if explicitly provided in settings
   - `owner`: optional field, only added if provided
   - `contactEmail`: optional field, only added if provided
4. Outputs JSON files to `src/generated/` for runtime import

**Common patterns:**
- Minimal: Just `description` (most common)
- Custom name: Include `name` only for special formatting needs
- Full metadata: All fields for important/critical nodes

### Customizing for Your Organization
- Create your own views by adding folders to `/src/data/[your-view-name]/`
- Design hierarchies that match your organizational structure
- Add/modify folders within each view to update the visualization
- **Required**: Add a `_settings.js` file to every directory (minimum: `export default {};`)
  - The file itself is required for Git tracking
  - The metadata within is optional:
    - Only include `name` if you need special formatting beyond auto-formatting
    - `description` is recommended for meaningful tooltips
    - Use `nodeColor` sparingly to highlight important sections
    - Add `owner` and `contactEmail` fields to track ownership
- Run `pnpm dev` - changes are auto-detected and trigger regeneration
- Settings reference document (`docs/SETTINGS_REFERENCE.md`) has detailed examples

### Core Philosophy
This tool exists because ownership visibility creates accountability. It's not about perfect documentation—it's about making it obvious who's responsible for what, reducing finger-pointing, and helping developers care about their craft.
