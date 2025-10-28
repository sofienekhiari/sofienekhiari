# Copilot Instructions for sofienekhiari.github.io

## Project Overview

This is a personal academic website for Sofiene Khiari (computational pharmacy PhD researcher at University of Basel). The site is built with **Quarto** and outputs static HTML to the `docs/` directory for GitHub Pages hosting at sofk.ch.

### Critical Context

- **Build system**: Quarto (configured in `_quarto.yml`)
- **Output directory**: `docs/` (GitHub Pages source)
- **Domain**: sofk.ch (via CNAME)

## Architecture

### Site Structure

```
├── _quarto.yml          # Main Quarto config - website settings, navbar, theme
├── index.qmd            # Homepage with "jolla" about template
├── blog.qmd             # Blog listing page (currently placeholder)
├── publications.qmd     # Research publications page
├── uses.qmd             # Tools & technologies page
├── styles.css           # Custom CSS
├── images/              # Profile pictures and assets
└── docs/                # Generated output (DO NOT EDIT DIRECTLY)
```

## Development Workflow

### Local Preview

```bash
quarto preview
```

Runs a local development server with live reload. This is the primary development command.

### Building for Production

```bash
quarto render
```

Generates static site to `docs/` directory. GitHub Pages serves from this directory.

### Key Build Configuration

From `_quarto.yml`:
- Output directory: `output-dir: docs`
- Theme: `lux` (Bootswatch theme)
- Renders all `.qmd` files in the root directory

## Content Patterns

### Page Headers (YAML Frontmatter)

**Homepage** (`index.qmd`):
```yaml
---
title: "Sofiene Khiari"
toc: false
about:
  template: jolla      # Special Quarto template for about pages
  image: images/profile_picture.jpg
  links:              # Social links rendered as icons
    - icon: github
      text: Github
      href: https://github.com/sofienekhiari
---
```

**Listing Pages** (`blog.qmd`):
```yaml
---
title: "Blog"
listing:
  contents: posts      # Directory containing posts
  sort: "date desc"
  type: default
  categories: true
page-layout: full
---
```

### Publications Format

Publications in `publications.qmd` follow this structure:
```markdown
##### [Title]

[Authors]
<br>[Journal/Venue] | [Date] | DOI: [link]
<br>_[Keywords as italics]_

---
```

## Project-Specific Conventions

### Content Organization

- **Pages**: Top-level `.qmd` files (index, blog, publications, uses)
- **Blog posts**: Would go in `posts/` directory (currently just a placeholder in `blog.qmd`)
- **Images**: `images/` directory for all assets
- **Styles**: Single `styles.css` file for custom CSS

### Quarto-Specific Patterns

1. **About page template**: The homepage uses Quarto's `jolla` template which auto-generates the layout from YAML frontmatter
2. **Listings**: Blog uses Quarto's listing feature to auto-generate post listings
3. **HTML output only**: This site generates HTML only (no PDF/DOCX)

### Theme & Styling

- Base theme: `lux` (from Bootswatch)
- Custom overrides: `styles.css`
- Footer: Configured in `_quarto.yml` with copyright and contact links

## Critical Notes for AI Agents

### REQUIRED: Pre-Flight Checks (Every Run)

**Before making ANY changes to this codebase:**

1. **Verify these instructions are current**: Check if `.github/copilot-instructions.md` reflects the actual codebase state. If outdated or missing critical patterns, update it immediately.

2. **Consult Quarto documentation**: Use the MCP Context7 server to fetch latest Quarto documentation for correct syntax and patterns:
   ```
   mcp_context7_resolve-library-id: "quarto-dev/quarto-cli"
   mcp_context7_get-library-docs: topic relevant to your task
   ```
   **Always verify syntax against official docs** - don't rely on memory for Quarto YAML frontmatter, configuration options, or special features.

### DO NOT:
- Edit anything in `docs/` directly (it's auto-generated)
- Change `output-dir` in `_quarto.yml` (GitHub Pages depends on `docs/`)
- Make Quarto changes without first checking current documentation via Context7

### DO:
- Run `quarto preview` to test changes locally
- Maintain YAML frontmatter consistency with existing pages
- Keep the `CNAME` file in root (contains `sofk.ch` domain)
- Follow the established publication format in `publications.qmd`
- Validate all Quarto syntax against official documentation before implementing

### When Adding Content:
1. **Check Quarto docs** via Context7 for the feature you're implementing
2. Create `.qmd` files in the appropriate location
3. Use existing pages as templates for frontmatter structure
4. Test with `quarto preview` before committing
5. Run `quarto render` to update `docs/` for deployment

## Technology Context

Per the researcher's background (see `uses.qmd` for full stack):
- **Python** is the primary scientific programming language
- **Pandas/PyTorch/NumPy** for data science work
- **Streamlit** for web apps
- Focus on computational pharmacy, drug discovery, deep learning

When suggesting code examples or tooling, align with this Python/data science stack.
