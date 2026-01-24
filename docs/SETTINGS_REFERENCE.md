# _settings.js Reference

Every directory in `/src/data/` requires a `_settings.js` file (Git doesn't track empty folders).

## All Available Fields

```javascript
const _settings = {
  // Custom display name (optional - folder name is auto-formatted by default)
  // Example: "Time-and-Attendance" folder → "Time And Attendance"
  // Use this only if you need special formatting like "Time & Attendance"
  name: "Time & Attendance",

  // Tooltip text shown on hover
  description: "Employee time tracking and attendance management",

  // Team or person responsible
  owner: "Workforce Management Team",

  // Contact for questions or incidents
  contactEmail: "workforce-team@example.com",

  // Custom hex color (optional - use sparingly to highlight important nodes)
  nodeColor: "#E74C3C"
};

export default _settings;
```

## Common Usage

Most files only need a description:

```javascript
const _settings = {
  description: "Handles user authentication"
};
export default _settings;
```

Minimum valid file:

```javascript
export default {};
```
