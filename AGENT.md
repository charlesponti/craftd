# AGENT.md - CraftD React App

## Build & Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript type checking (includes Cloudflare types)
- `npm run preview` - Preview production build
- `npm run deploy` - Build and deploy to Cloudflare

## Code Style & Conventions

### Formatting (Biome)
- Use 2 space indentation
- Single quotes for JS/TS, double quotes for JSX attributes
- 100 character line width
- Trailing commas (ES5 style)
- Arrow functions use parentheses

### TypeScript
- Define interfaces for all component props and form data
- Use React.FC for functional components
- Prefer `type` for union types, `interface` for object shapes
- Use optional chaining and nullish coalescing for safety

### React Patterns
- Use react-hook-form for forms with proper TypeScript types
- Use TanStack Query for data fetching with proper error handling
- Import React explicitly when using JSX
- Props use snake_case for data fields, camelCase for handlers
- Organize imports: React first, then libraries, then local modules
