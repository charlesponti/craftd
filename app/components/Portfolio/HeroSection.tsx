import type React from 'react'

// Assuming SocialLink and Portfolio types are available or defined elsewhere
// For now, let's define a minimal structure if not globally available
interface SocialLink {
  platform: string
  url: string
  username?: string
}

interface HeroSectionProps {
  name?: string | null
  jobTitle?: string | null // 'title' in Portfolio interface
  bio?: string | null // 'description' in Portfolio interface
  tagline?: string | null
  avatarUrl?: string | null // 'profile_image_url' in Portfolio interface
  socialLinks?: SocialLink | null // Simplified: expecting a single object or null
  availabilityStatus?: string | null
}

const HeroSection: React.FC<HeroSectionProps> = ({
  name,
  jobTitle,
  bio,
  tagline,
  avatarUrl,
  socialLinks, // For now, let's assume this is a single social link object for simplicity
  availabilityStatus,
}) => {
  return (
    <section className="bg-gray-100 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          {avatarUrl && (
            <div className="md:w-1/3 mb-8 md:mb-0 md:mr-10">
              <img
                src={avatarUrl}
                alt={name || 'User Avatar'}
                className="rounded-full w-48 h-48 md:w-64 md:h-64 object-cover mx-auto shadow-lg"
              />
            </div>
          )}
          <div className={avatarUrl ? 'md:w-2/3 text-center md:text-left' : 'w-full text-center'}>
            {tagline && <p className="text-lg text-indigo-600 font-semibold mb-2">{tagline}</p>}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {name || 'Your Name'}
            </h1>
            {jobTitle && <p className="text-2xl text-gray-700 mb-6">{jobTitle}</p>}
            {bio && <p className="text-gray-600 mb-6 text-lg leading-relaxed">{bio}</p>}
            {availabilityStatus && (
              <div className="mb-6">
                <span className="inline-block bg-green-200 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
                  {availabilityStatus === 'available'
                    ? 'Available for hire'
                    : availabilityStatus === 'open_to_offers'
                      ? 'Open to offers'
                      : 'Currently unavailable'}
                </span>
              </div>
            )}
            {socialLinks && ( // Assuming socialLinks is a single object for now
              <div className="flex justify-center md:justify-start space-x-4">
                <a
                  href={socialLinks.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 transition duration-300"
                >
                  {socialLinks.platform || 'Social Profile'}
                  {/* Ideally, map platform to an icon or better text */}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
