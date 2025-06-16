# RANDSUM Documentation Site

This directory contains the source files for the RANDSUM GitHub Pages site hosted at [https://randsum.github.io/randsum](https://randsum.github.io/randsum).

## Structure

```
docs/
├── index.html          # Main homepage
├── styles/
│   └── main.css        # Main stylesheet
├── scripts/
│   ├── main.js         # Main site functionality
│   └── demo.js         # Interactive demo functionality
├── api/
│   ├── index.html      # API documentation homepage
│   ├── api.css         # API documentation styles
│   ├── api.js          # API documentation functionality
│   └── generated/      # Auto-generated TypeDoc documentation
└── README.md           # This file
```

## Development

To work on the site locally:

1. **Build the packages first:**
   ```bash
   bun run build
   ```

2. **Generate API documentation:**
   ```bash
   bun run docs:generate
   ```

3. **Serve the site locally:**
   ```bash
   bun run docs:serve
   ```
   
   Then open http://localhost:8000 in your browser.

## Features

### Homepage
- Hero section with project overview
- Feature highlights
- Getting started guide
- Package showcase
- Interactive demo

### API Documentation
- Auto-generated from JSDoc comments using TypeDoc
- Searchable and navigable interface
- Code examples with syntax highlighting
- Copy-to-clipboard functionality

### Interactive Demo
- Live dice rolling demonstration
- Support for various dice notations
- Preset examples for common use cases
- Real-time result display

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch via GitHub Actions. The workflow:

1. Builds all packages
2. Generates TypeDoc documentation
3. Deploys the `docs/` directory to GitHub Pages

## Customization

### Styling
- Main styles are in `styles/main.css`
- Uses CSS custom properties for theming
- Responsive design with mobile-first approach

### Content
- Homepage content is in `index.html`
- API documentation structure is in `api/index.html`
- Auto-generated API docs are in `api/generated/`

### Functionality
- Main site interactions in `scripts/main.js`
- Demo functionality in `scripts/demo.js`
- API documentation features in `api/api.js`

## Contributing

When adding new features or packages:

1. Update the homepage package showcase
2. Ensure JSDoc comments are comprehensive
3. Test the interactive demo with new notation
4. Regenerate documentation with `bun run docs:generate`

The site will automatically update when changes are merged to main.
