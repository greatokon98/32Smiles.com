"use client"

import Image from "next/image"
import { Prisma } from "@prisma/client"

type TeamMemberItem = Prisma.TeamMemberGetPayload<{
  include: {
    content: {
      include: {
        featuredImage: true
      }
    }
    photoFile: true
  }
}>

export function TeamProfile({
  member,
  photoUrl,
}: {
  member: TeamMemberItem
  photoUrl: string | null | undefined
}) {
  const socialLinks = member.socialLinks as Record<string, string> | null

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
      <div className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-2xl overflow-hidden shadow-xl shrink-0 bg-gradient-to-br from-primary-50 to-primary-100">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={member.content.title}
            fill
            className="object-cover"
            sizes="160px"
            priority
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-5xl font-bold text-primary-200">
              {member.content.title.charAt(0)}
            </span>
          </div>
        )}
      </div>

      <div>
        <h1 className="text-3xl lg:text-5xl font-bold mb-3">
          {member.content.title}
        </h1>
        <p className="text-xl text-primary-200 font-medium mb-4">
          {member.specialty}
        </p>
        {member.credentials && (
          <p className="text-primary-100 mb-4">{member.credentials}</p>
        )}
        {socialLinks && Object.keys(socialLinks).length > 0 && (
          <div className="flex items-center gap-3">
            {Object.entries(socialLinks).map(([platform, url]) => (
              <a
                key={platform}
                href={url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors text-sm capitalize"
              >
                {platform.charAt(0)}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
