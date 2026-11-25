# HOP Frontend

This directory contains the client-side single-page application (SPA) for the HOP platform.

---

## Architecture & Directory Layout

```
frontend/
├── public/           # Static assets directly served by the web server
└── src/
    ├── assets/       # Static media assets (SVG icons, images, fonts)
    ├── components/   # Reusable UI components (buttons, modals, inputs, tables)
    ├── pages/        # View components mapped to application routes
    ├── layouts/      # Structural layout wrappers (Header, Sidebar, Shells)
    ├── routes/       # Route definitions, nested routes, and route protection guards
    ├── services/     # API integration layer, Axios/Fetch HTTP clients, interceptors
    ├── hooks/        # Reusable custom React hooks
    ├── context/      # Global state providers (AuthContext, ThemeContext, etc.)
    ├── utils/        # Utility helpers, validators, date and string formatters
    └── styles/       # Global CSS, themes, variables, and styling tokens
```

---

## Technology Plan

- **Framework:** React 18+ (with TypeScript)
- **Tooling:** Vite
- **Routing:** React Router v6+
- **HTTP Client:** Axios or native Fetch with centralized interceptors
- **State Management:** React Context API / custom hooks for lightweight state; dedicated state manager if needed

---

## Status

> **Notice:** Scaffolding phase only. React has not been initialized and dependencies have not been installed yet. Initialization will take place in subsequent development phases.
