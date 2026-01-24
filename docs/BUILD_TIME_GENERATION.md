# Build-Time Data Generation

This document explains how the Master Compass generates its visualization data at build time using Vite and Node.js.

## Overview

Instead of scanning the directory structure at runtime in the browser, we now generate static JSON data files **during the build process**. This approach:

- ✅ Uses Node.js `fs` APIs for complete filesystem access
- ✅ Generates static, optimized data files
- ✅ Improves application startup performance
- ✅ Makes the data structure easy to inspect and debug

**Important Git Limitation:** While the build script can process empty directories on your local machine, **Git does not track empty directories**. When you push to a repository or deploy to Vercel, any directory without at least one file will be ignored and disappear from the build. To ensure all nodes appear in production, add a minimal `_settings.js` file to every directory.

See [settings reference](./SETTINGS_REFERENCE.md) for available settings and their usage.

## Architecture Benefits

- ✅ No More JSON Editing - Teams don't need to understand JSON syntax
- ✅ Version Control Friendly - Easier to track changes in git
- ✅ Less Merge Conflicts - Each team can work in their own folder
- ✅ Self-Documenting - Folder structure is immediately visible
- ✅ Smart Defaults - Auto-formatting means less manual work
- ✅ Scalable - Can handle hundreds or thousands of nodes efficiently
- ✅ Uses Node.js `fs` APIs with full filesystem access
- ✅ Fast initial load - data is pre-generated
- ✅ Easy to inspect generated data
- ✅ Better caching
- ✅ Stable HMR - Changes detected and reloaded automatically
