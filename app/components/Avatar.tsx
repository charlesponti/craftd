import { cn } from '~/lib/utils'
import type { User } from '../lib/auth.server'

// Helper function to get avatar URL from user
const getAvatarUrl = (user: User): string | undefined => {
  return user.supabaseUser?.user_metadata?.avatar_url as string | undefined
}

interface AvatarProps {
  user: User
  className?: string
}

export const Avatar = ({ user, className = 'size-8' }: AvatarProps) => {
  const avatarUrl = getAvatarUrl(user)

  return (
    <div
      className={cn(
        className,
        'bg-muted border border-input rounded-full flex items-center justify-center transition-fast'
      )}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={user.name || 'User'}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <span className="text-sm font-medium text-muted-foreground">
          {(user.name || user.email || 'U')[0].toUpperCase()}
        </span>
      )}
    </div>
  )
}
