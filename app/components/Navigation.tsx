import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'

// Icon components (simplified SVG icons)
const MenuIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    role="img"
    aria-label="Menu"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
    />
  </svg>
)

const XIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    role="img"
    aria-label="Close"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const PencilIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    role="img"
    aria-label="Edit"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
    />
  </svg>
)

// User type interface
interface User {
  name?: string
  email?: string
  avatarUrl?: string
}

// Avatar component
const Avatar = ({ user, className = 'w-8 h-8' }: { user: User; className?: string }) => (
  <div
    className={`${className} bg-gray-200 border border-gray-200 rounded-full flex items-center justify-center`}
  >
    {user?.avatarUrl ? (
      <img
        src={user.avatarUrl}
        alt={user.name || 'User'}
        className="w-full h-full rounded-full object-cover"
      />
    ) : (
      <span className="text-sm font-medium text-gray-600">
        {(user?.name || user?.email || 'U')[0].toUpperCase()}
      </span>
    )}
  </div>
)

// Utility function for conditional classes
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ')
}

export default function Navigation() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isNavHidden, setIsNavHidden] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Navigation links - conditional based on user state
  const navLinks = user ? [] : [{ href: '/demo', label: 'Demo' }]

  // Handle scroll for background blur effect and hide/show nav on scroll
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Check if scrolled down
      setIsScrolled(currentScrollY > 10)

      // Hide navigation when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY + 10 && currentScrollY > 100) {
        setIsNavHidden(true)
      } else if (currentScrollY < lastScrollY - 10 || currentScrollY < 50) {
        setIsNavHidden(false)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Close menu when clicking outside or on link
  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  // Check if current page
  const isCurrentPage = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      closeMenu()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <>
      {/* Main Navigation */}
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out',
          isNavHidden ? '-translate-y-full' : 'translate-y-0',
          isScrolled ? 'backdrop-blur-2xl bg-white/70 shadow-sm' : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 group transition-all duration-300 hover:scale-105 hover:opacity-80"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center text-white text-sm font-medium shadow-lg">
                C
              </div>
              <span className="font-sans text-xl font-medium tracking-tight text-gray-900">
                Craftd
              </span>
            </Link>

            {/* Desktop Navigation */}
            {navLinks.length > 0 && (
              <div className="hidden md:flex items-center gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      'relative px-4 py-2 font-sans text-sm font-medium transition-all duration-300 rounded-full',
                      isCurrentPage(link.href)
                        ? 'text-white bg-gray-900'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {/* User Menu or Sign In */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="hidden md:flex items-center gap-4">
                  <Link
                    to="/editor"
                    className={cn(
                      'inline-flex gap-2 items-center justify-center px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300',
                      isCurrentPage('/editor')
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    )}
                  >
                    <PencilIcon className="w-4 h-4" />
                    Editor
                  </Link>

                  {/* Account dropdown */}
                  <Link
                    to="/account"
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <span className="mr-2">Account</span>
                    <Avatar user={user} />
                  </Link>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-3">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium rounded-full text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/onboarding"
                    className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 shadow-sm hover:shadow"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none"
                aria-label="Open navigation menu"
              >
                {isMenuOpen ? <XIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1 divide-y divide-gray-100">
              {navLinks.length > 0 && (
                <div className="py-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={closeMenu}
                      className={cn(
                        'block px-4 py-2.5 text-base font-medium rounded-md transition-colors',
                        isCurrentPage(link.href)
                          ? 'bg-gray-50 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}

              <div className="py-2">
                {user ? (
                  <>
                    <Link
                      to="/account"
                      onClick={closeMenu}
                      className="flex items-center px-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                    >
                      <Avatar user={user} className="w-8 h-8 mr-3" />
                      My Account
                    </Link>
                    <Link
                      to="/editor"
                      onClick={closeMenu}
                      className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                    >
                      Portfolio Editor
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={closeMenu}
                      className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/onboarding"
                      onClick={closeMenu}
                      className="block px-4 py-2.5 my-2 text-base font-medium text-center text-white bg-gray-900 hover:bg-gray-800 rounded-md shadow-sm mx-4"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile menu backdrop */}
      {isMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/5 backdrop-blur-sm z-40 md:hidden cursor-default"
          onClick={closeMenu}
          aria-label="Close menu"
        />
      )}
    </>
  )
}
