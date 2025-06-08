# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Previewing the Production Build

Preview the production build locally:

```bash
npm run preview
```

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

Deployments are performed by the Github Action at: [Deploy](./.github/workflows/fly-deploy.yml)

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

## Local PostgreSQL for Development

To run a local PostgreSQL instance using Docker:

```bash
docker-compose up -d
```

Rename `.env.example` to `.env` and set your environment variables:

```dotenv
VITE_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/craftd_dev
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/craftd_dev
```

Run database migrations:

```bash
npx drizzle-kit migrate:up
```

Start the development server:

```bash
npm run dev
```

---

Built with ❤️ using React Router.
