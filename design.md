# Minimalist Design System (Outstatic Vibe)

This document defines the strict, human-crafted, ultra-minimalist design system for the **Simple Clean Blog CMS**. It eliminates bloated decorations, neon gradients, clutter, and unrequested AI telemetry elements.

## Core Tokens & Principles

### 1. Color Palette (Absolute Simplicity)
- **Background**: White (`bg-white`) / Warm light grey page container (`bg-zinc-50`).
- **Borders**: Thin, crisp, light neutral line (`border-zinc-200` or `border-zinc-100`).
- **Text Primary**: Deep black/charcoal (`text-zinc-900`).
- **Text Secondary**: Balanced, readable grey (`text-zinc-500` or `text-zinc-400`).
- **Accent Primary**: Deep solid black for actions (`bg-zinc-900 text-white hover:bg-zinc-800`).
- **Dangerous**: Subtle desaturated red (`text-red-500 hover:bg-red-50`).

### 2. Typography Guide
- **Headers**: Clean sans-serif paired with tight letter-spacing (`font-sans font-semibold tracking-tight text-zinc-900`).
- **Body Text**: Readable, wide-leading sans-serif or crisp monospace (`font-mono text-xs`).
- **No Exaggerated Titles**: Standard bold titles matching elegant layout constraints.

### 3. Layout Systems
- **Breadcrumbs Nav**: Horizontal path style with fine divider lines (`/`) or right-pointing small carets.
- **Card Lists**: Clean layout grids, cards frame details without background stripes or complex animations.
- **Sidebars / Workspaces**: Two-column layout in standard desktop CMS mode. Left sidebar is collapsible. Right sidebar holds configuration collapsible segments.

---

## Shared Utility Classes (CSS Tokens map)

We map these named class constants in our React components (e.g. from a shared context or config file) to ensure we don't write "every Tailwind class under the sun" directly inline.

### Base Containers
- **Card**: `bg-white border border-zinc-200/85 rounded-xl p-6 shadow-sm`
- **Mini-Card**: `bg-white border border-zinc-100 rounded-lg p-4`
- **Container**: `max-w-6xl mx-auto px-6`

### Typography & Headers
- **Section Heading**: `font-sans text-xl font-semibold tracking-tight text-zinc-900`
- **Item Title**: `font-sans text-base font-medium text-zinc-900`
- **Metadata Text**: `font-mono text-[11px] text-zinc-400 uppercase tracking-widest`

### Interactive Buttons & Action Selectors
- **Primary Button**: `inline-flex items-center justify-center px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition-colors`
- **Secondary Button**: `inline-flex items-center justify-center px-4 py-2 border border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-white text-xs font-medium rounded-lg transition-colors`
- **Sidebar Row Link**: `w-full text-left px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-650 hover:bg-zinc-50 hover:text-zinc-900 transition-all flex items-center space-x-2`
- **Sidebar Row Link Active**: `w-full text-left px-3.5 py-2 rounded-lg text-xs font-semibold text-zinc-950 bg-zinc-100 flex items-center space-x-2`

### Inputs
- **Base Input / Dropdown**: `w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-0 text-zinc-800`
