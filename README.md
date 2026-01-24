# Master Compass

**An interactive organizational navigation tool built to end the blame game and create real ownership.**

When applications break, teams point fingers. When new developers join, they're lost. When engineering teams across different domains need to collaborate, they don't know who to talk to. These fundamental problems create preventable friction that slows organizations down.

Master Compass won't magically fix broken systems overnight. But it will do something more important: it makes ownership visible, responsibility clear, and accountability unavoidable. It's a tool to help developers and teams rediscover what it means to own their craft.

> **🔧 For Engineering Teams**
> This application is designed for internal software engineering teams to improve collaboration and reduce operational friction. Customize it to match your organization's structure and needs.

---

## Table of Contents

- [What This Is](#what-this-is)
- [Why This Exists](#why-this-exists)
- [Organizing Your Views](#organizing-your-views)
  - [Example Views](#example-views)
  - [Create Your Own Views](#create-your-own-views)
- [How to Use](#how-to-use)
- [Getting Started & Customizing](#getting-started--customizing)
- [Extensibility](#extensibility)
- [Contributing to Master Compass](#contributing-to-master-compass)

---

## What This Is

An interactive circle-packing visualization that shows your engineering organization from multiple perspectives you define. Click through layers to drill down, hover for details, customize to fit your needs.

**Key features:** Fully customizable views • Visual ownership tracking • Interactive hierarchy navigation

---

## Why This Exists

**The real problem isn't lack of documentation—it's lack of ownership visibility.**

When applications break, teams point fingers. Wikis go stale. Knowledge lives in people's heads. Master Compass makes ownership non-negotiable and visual—updating it is as simple as moving folders.

**Benefits:** Speed up onboarding • Reduce cross-team friction • Make accountability unavoidable

---

## Organizing Your Views

Master Compass is **fully customizable**. You define the views and hierarchies that make sense for your organization. The included examples are just starting points—replace them with structures that match your needs.

### Example Views

The repository includes sample views to demonstrate the concept. **Replace these with your own organizational structure:**

### 1. Product-Feature View (Example)

**Hierarchy:** Client Segments → Products/Features

This example organizes around product offerings per client segment:

```
Product-Feature-View/
├── Enterprise-Clients/
│   ├── Payments/
│   ├── Terminal/
│   ├── Checkout/
│   ├── Time-and-Attendance/
│   ├── AI-Assistant/
│   └── Analytics/
└── Small-Size-Clients/
    ├── Payments/
    ├── Terminal/
    ├── Checkout/
    └── Analytics/
```

**Use cases for this type of view:**
- Understanding product portfolio by customer segment
- Identifying feature parity gaps between segments
- Visualizing product ownership and responsibility

See `/src/data/Product-Feature-View/` for the complete structure.

### 2. Domain-Team View (Example)

**Hierarchy:** Client Segments → Geographic Regions → Specialized Teams

This example shows a geographic and functional team organization:

```
Domain-Team-View/
├── Enterprise-Clients/
│   ├── EU-Clients/
│   │   ├── QA-Team/
│   │   ├── DB-Team/
│   │   ├── Security-Team/
│   │   ├── Performance-Team/
│   │   └── Ops-Team/
│   ├── US-Clients/
│   │   └── [Same team structure]
│   └── CA-Clients/
│       └── [Same team structure]
└── Small-Size-Clients/
    ├── EU-Clients/
    │   └── [Team structure]
    └── US-Clients/
        └── [Team structure]
```

**Use cases for this type of view:**
- Understanding team distribution across regions
- Identifying the right team for regional issues
- Visualizing functional team coverage

See `/src/data/Domain-Team-View/` for the complete structure.

### Create Your Own Views

**Consider these organizational perspectives for your team:**

- **Technology Stack View**: Frontend → Components → Libraries → Owners
- **Microservices View**: Platform → Services → APIs → Teams
- **Business Domain View**: Domains → Capabilities → Systems → Owners
- **Infrastructure View**: Cloud → Environments → Resources → Teams
- **Customer Journey View**: Stages → Touchpoints → Systems → Owners
- **Data Flow View**: Sources → Pipelines → Destinations → Teams

**The structure is entirely up to you.** Create folders that match how your organization thinks about ownership and accountability.

---

## How to Use

1. Select a view (tabs at top)
2. Click circles to drill down
3. Hover to see ownership and metadata
4. Use breadcrumbs to navigate up

Circle size = relative importance or scope.

---

## Getting Started

**Folder structure = data structure.** Your organization is generated from `/src/data`.

### Quick Setup

1. Create view folders in `/src/data/` (e.g., `/src/data/Your-View/`)
2. Build your hierarchy with nested folders
3. Add `_settings.js` to every directory (required for Git tracking)
4. Run `pnpm dev` to preview

**Folder names:** Use hyphens (`Payment-Services`) → auto-formatted to spaces and title case.

**Example:**
```
/src/data/Your-View/
├── Platform/              (+ _settings.js)
│   ├── Auth/              (+ _settings.js)
│   └── Payments/          (+ _settings.js)
```

### _settings.js

Required in every directory (Git doesn't track empty folders). See [Settings Reference](./docs/SETTINGS_REFERENCE.md) for all options.

---

## Extensibility

Master Compass is built with flexibility in mind. The architecture allows developers to extend functionality to meet their specific needs. For example, you could integrate third-party APIs (like Jira, GitHub, or PagerDuty) to display real-time data such as open issues, recent commits, or incident counts on relevant feature nodes.

The codebase is designed to be modified and enhanced based on your organization's requirements.

---

## Contributing to Master Compass

This is an open-source project. Contributions, feature requests, and feedback are welcome.

**Built with the goal of making ownership visible and accountability clear.**
