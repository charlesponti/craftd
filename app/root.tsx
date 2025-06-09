import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { LoaderFunctionArgs } from 'react-router'
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router'

import { ToastProvider } from './hooks/useToast'

import './app.css'
import Navigation from './components/Navigation'
import { getAuthenticatedUser } from './lib/auth.server'

export const links = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
]

// Root loader to get authenticated user
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getAuthenticatedUser(request)
  return { user }
}

// Add route handle to enable accessing loader data from child routes
export const handle = {
  id: 'root',
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

// Instantiate a single QueryClient for the app
const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <div className="flex flex-col min-h-screen overflow-hidden">
          <Navigation />
          <div className="font-sans pt-16 flex-1 flex flex-col">
            <Outlet />
          </div>
        </div>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export function ErrorBoundary({ error }: { error: unknown }) {
  if (isRouteErrorResponse(error)) {
    const err = error
    if (err.status === 404) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50">
          <h1 className="text-9xl font-extrabold text-gray-900">404</h1>
          <p className="mt-4 text-2xl text-gray-700">Page Not Found</p>
          <Link
            to="/"
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Home
          </Link>
        </div>
      )
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
        <h1 className="text-6xl font-bold text-red-900">{err.status}</h1>
        <p className="mt-2 text-xl text-red-700">{err.statusText}</p>
        <Link to="/" className="mt-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Go Home
        </Link>
      </div>
    )
  }
  const isDev = import.meta.env.DEV
  const message = isDev && error instanceof Error ? error.message : 'An unexpected error occurred.'
  const stack = isDev && error instanceof Error ? error.stack : null
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Oops!</h1>
      <p className="text-gray-700 mb-4">{message}</p>
      {stack && (
        <pre className="w-full max-w-2xl max-h-48 border border-red-200 p-4 bg-white rounded shadow overflow-auto text-sm text-gray-800 mb-4">
          {stack}
        </pre>
      )}
      <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Go Home
      </Link>
    </div>
  )
}
