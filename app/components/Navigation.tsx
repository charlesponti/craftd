import { BriefcaseIcon, MenuIcon, PencilIcon, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Button, getButtonClasses } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { useUser } from '../hooks/useAuth'
import { createClient } from '../lib/supabase/client'

// User type interface
interface User {
  name?: string
  email?: string
  avatarUrl?: string
}

const Avatar = ({ user, className = 'size-8' }: { user: User; className?: string }) => (
  <div
    className={cn(
      className,
      'bg-muted border border-input rounded-full flex items-center justify-center transition-fast'
    )}
  >
    {user?.avatarUrl ? (
      <img
        src={user.avatarUrl}
        alt={user.name || 'User'}
        className="w-full h-full rounded-full object-cover"
      />
    ) : (
      <span className="text-sm font-medium text-muted-foreground">
        {(user?.name || user?.email || 'U')[0].toUpperCase()}
      </span>
    )}
  </div>
)

export default function Navigation() {
  const user = useUser()

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
      const supabase = await createClient()
      await supabase.auth.signOut()
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
          'fixed top-0 left-0 right-0 z-50 transition-base',
          isNavHidden ? '-translate-y-full' : 'translate-y-0',
          isScrolled
            ? 'backdrop-blur-xl bg-background/80 border-b border-border shadow-sm'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-lg">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-sm group transition-fast hover:opacity-80"
            >
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                <img
                  src="/public/icons/icon-192x192.png"
                  alt="Craftd Logo"
                  className="h-6 w-auto transition-fast group-hover:opacity-80"
                />
              </div>
              <span className="font-sans text-xl font-semibold tracking-tight text-foreground">
                Craftd
              </span>
            </Link>

            {/* Desktop Navigation */}
            {navLinks.length > 0 && (
              <div className="hidden md:flex items-center gap-sm">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      getButtonClasses({ variant: 'ghost', size: 'sm' }),
                      isCurrentPage(link.href)
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {/* User Menu or Sign In */}
            <div className="flex items-center gap-sm">
              {user ? (
                <div className="hidden md:flex items-center gap-md">
                  <Link
                    to="/editor"
                    className={cn(
                      getButtonClasses({ variant: 'ghost', size: 'sm' }),
                      'inline-flex gap-sm items-center',
                      isCurrentPage('/editor')
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <PencilIcon className="w-4 h-4" />
                    Editor
                  </Link>

                  <Link
                    to="/career"
                    className={cn(
                      getButtonClasses({ variant: 'ghost', size: 'sm' }),
                      'inline-flex gap-sm items-center',
                      isCurrentPage('/career')
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <BriefcaseIcon className="w-4 h-4" />
                    Career
                  </Link>

                  {/* Account dropdown */}
                  <Link
                    to="/account"
                    className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-fast px-sm py-xs rounded-md hover:bg-accent"
                  >
                    <span className="mr-2">Account</span>
                    <Avatar user={user} />
                  </Link>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-sm">
                  <Link to="/login" className={getButtonClasses({ variant: 'ghost', size: 'sm' })}>
                    Log In
                  </Link>
                  <Link
                    to="/onboarding"
                    className={getButtonClasses({ variant: 'primary', size: 'sm' })}
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <Button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation menu"
              >
                {isMenuOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border shadow-lg">
            <div className="px-lg py-lg space-y-1">
              {navLinks.length > 0 && (
                <div className="space-y-1 pb-lg border-b border-border">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={closeMenu}
                      className={cn(
                        'block px-md py-sm text-base font-medium rounded-md transition-fast',
                        isCurrentPage(link.href)
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}

              <div className="space-y-1 pt-lg">
                {user ? (
                  <>
                    <Link
                      to="/account"
                      onClick={closeMenu}
                      className="flex items-center gap-sm px-md py-sm text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-fast"
                    >
                      <Avatar user={user} className="size-8" />
                      My Account
                    </Link>
                    <Link
                      to="/editor"
                      onClick={closeMenu}
                      className="flex items-center gap-sm px-md py-sm text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-fast"
                    >
                      <PencilIcon className="size-4" />
                      Editor
                    </Link>
                    <Link
                      to="/career"
                      onClick={closeMenu}
                      className="flex items-center gap-sm px-md py-sm text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-fast"
                    >
                      <BriefcaseIcon className="w-4 h-4" />
                      Career
                    </Link>
                    <Button
                      type="button"
                      onClick={handleSignOut}
                      variant="ghost"
                      className="block w-full text-left px-md py-sm text-base font-medium justify-start"
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={closeMenu}
                      className="block px-md py-sm text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-fast"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/onboarding"
                      onClick={closeMenu}
                      className={cn(
                        getButtonClasses({ variant: 'primary', size: 'default' }),
                        'block mx-md my-sm text-center'
                      )}
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
          className="fixed inset-0 bg-background/20 backdrop-blur-sm z-40 md:hidden cursor-default transition-fast"
          onClick={closeMenu}
          aria-label="Close menu"
        />
      )}
    </>
  )
}
