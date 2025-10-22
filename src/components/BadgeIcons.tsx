// Matcha Leaf Badge Icons
// 4 tiers: First Record, 3 Records, 7 Records, 30 Records

interface BadgeIconProps {
  size?: number;
}

// Tier 1: First Record - Single small leaf
export function FirstRecordBadge({ size = 48 }: BadgeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="23" fill="rgba(127, 176, 105, 0.1)" stroke="#7FB069" strokeWidth="2"/>
      <path
        d="M24 14 C20 18, 18 22, 20 26 C22 30, 26 32, 28 26 C30 22, 28 18, 24 14 Z"
        fill="#7FB069"
        stroke="#5a8a4d"
        strokeWidth="1"
      />
      <path
        d="M24 14 L24 20"
        stroke="#5a8a4d"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Tier 2: 3 Records - Three small leaves
export function ThreeRecordsBadge({ size = 48 }: BadgeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="23" fill="rgba(127, 176, 105, 0.15)" stroke="#7FB069" strokeWidth="2"/>

      {/* Left leaf */}
      <path
        d="M18 16 C15 19, 14 22, 15 25 C16 28, 19 29, 20 25 C21 22, 20 19, 18 16 Z"
        fill="#7FB069"
        stroke="#5a8a4d"
        strokeWidth="0.8"
      />
      <path d="M18 16 L18 21" stroke="#5a8a4d" strokeWidth="1" strokeLinecap="round"/>

      {/* Center leaf */}
      <path
        d="M24 14 C21 17, 20 20, 21 23 C22 26, 25 28, 27 23 C28 20, 27 17, 24 14 Z"
        fill="#7FB069"
        stroke="#5a8a4d"
        strokeWidth="0.8"
      />
      <path d="M24 14 L24 19" stroke="#5a8a4d" strokeWidth="1" strokeLinecap="round"/>

      {/* Right leaf */}
      <path
        d="M30 16 C27 19, 26 22, 27 25 C28 28, 31 29, 32 25 C33 22, 32 19, 30 16 Z"
        fill="#7FB069"
        stroke="#5a8a4d"
        strokeWidth="0.8"
      />
      <path d="M30 16 L30 21" stroke="#5a8a4d" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

// Tier 3: 7 Records - Cluster of leaves (more vibrant)
export function SevenRecordsBadge({ size = 48 }: BadgeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="23" fill="rgba(127, 176, 105, 0.2)" stroke="#7FB069" strokeWidth="2.5"/>

      {/* Top leaf */}
      <path
        d="M24 12 C21 15, 20 18, 21 21 C22 24, 25 25, 26 21 C27 18, 26 15, 24 12 Z"
        fill="#8BC34A"
        stroke="#5a8a4d"
        strokeWidth="1"
      />
      <path d="M24 12 L24 17" stroke="#5a8a4d" strokeWidth="1.2" strokeLinecap="round"/>

      {/* Left upper */}
      <path
        d="M17 17 C15 19, 14 21, 15 23 C16 25, 18 26, 19 23 C20 21, 19 19, 17 17 Z"
        fill="#7FB069"
        stroke="#5a8a4d"
        strokeWidth="0.8"
      />
      <path d="M17 17 L17 21" stroke="#5a8a4d" strokeWidth="1" strokeLinecap="round"/>

      {/* Right upper */}
      <path
        d="M31 17 C29 19, 28 21, 29 23 C30 25, 32 26, 33 23 C34 21, 33 19, 31 17 Z"
        fill="#7FB069"
        stroke="#5a8a4d"
        strokeWidth="0.8"
      />
      <path d="M31 17 L31 21" stroke="#5a8a4d" strokeWidth="1" strokeLinecap="round"/>

      {/* Bottom left */}
      <path
        d="M18 24 C16 26, 15 28, 16 30 C17 32, 19 33, 20 30 C21 28, 20 26, 18 24 Z"
        fill="#7FB069"
        stroke="#5a8a4d"
        strokeWidth="0.8"
      />
      <path d="M18 24 L18 28" stroke="#5a8a4d" strokeWidth="1" strokeLinecap="round"/>

      {/* Bottom center */}
      <path
        d="M24 26 C22 28, 21 30, 22 32 C23 34, 25 35, 26 32 C27 30, 26 28, 24 26 Z"
        fill="#8BC34A"
        stroke="#5a8a4d"
        strokeWidth="1"
      />
      <path d="M24 26 L24 30" stroke="#5a8a4d" strokeWidth="1.2" strokeLinecap="round"/>

      {/* Bottom right */}
      <path
        d="M30 24 C28 26, 27 28, 28 30 C29 32, 31 33, 32 30 C33 28, 32 26, 30 24 Z"
        fill="#7FB069"
        stroke="#5a8a4d"
        strokeWidth="0.8"
      />
      <path d="M30 24 L30 28" stroke="#5a8a4d" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

// Tier 4: 30 Records - Full matcha branch with multiple leaves (premium look)
export function ThirtyRecordsBadge({ size = 48 }: BadgeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="23" fill="rgba(127, 176, 105, 0.25)" stroke="#7FB069" strokeWidth="3"/>

      {/* Central branch */}
      <path d="M24 10 Q24 18, 24 38" stroke="#5a8a4d" strokeWidth="2.5" strokeLinecap="round"/>

      {/* Top leaves - golden green */}
      <path
        d="M24 12 C21 14, 20 16, 21 18 C22 20, 24 21, 25 18 C26 16, 25 14, 24 12 Z"
        fill="#9CCC65"
        stroke="#5a8a4d"
        strokeWidth="1"
      />

      {/* Second tier - left */}
      <path
        d="M16 18 C14 20, 13 22, 14 24 C15 26, 17 27, 18 24 C19 22, 18 20, 16 18 Z"
        fill="#8BC34A"
        stroke="#5a8a4d"
        strokeWidth="1"
      />
      <path d="M18 20 Q20 21, 24 21" stroke="#5a8a4d" strokeWidth="1.2" strokeLinecap="round"/>

      {/* Second tier - right */}
      <path
        d="M32 18 C30 20, 29 22, 30 24 C31 26, 33 27, 34 24 C35 22, 34 20, 32 18 Z"
        fill="#8BC34A"
        stroke="#5a8a4d"
        strokeWidth="1"
      />
      <path d="M30 20 Q28 21, 24 21" stroke="#5a8a4d" strokeWidth="1.2" strokeLinecap="round"/>

      {/* Third tier - left */}
      <path
        d="M15 25 C13 27, 12 29, 13 31 C14 33, 16 34, 17 31 C18 29, 17 27, 15 25 Z"
        fill="#7FB069"
        stroke="#5a8a4d"
        strokeWidth="1"
      />
      <path d="M17 27 Q20 28, 24 28" stroke="#5a8a4d" strokeWidth="1.2" strokeLinecap="round"/>

      {/* Third tier - right */}
      <path
        d="M33 25 C31 27, 30 29, 31 31 C32 33, 34 34, 35 31 C36 29, 35 27, 33 25 Z"
        fill="#7FB069"
        stroke="#5a8a4d"
        strokeWidth="1"
      />
      <path d="M31 27 Q28 28, 24 28" stroke="#5a8a4d" strokeWidth="1.2" strokeLinecap="round"/>

      {/* Bottom tier - left */}
      <path
        d="M17 32 C15 34, 14 36, 15 38 C16 40, 18 41, 19 38 C20 36, 19 34, 17 32 Z"
        fill="#7FB069"
        stroke="#5a8a4d"
        strokeWidth="1"
      />
      <path d="M19 34 Q21 35, 24 35" stroke="#5a8a4d" strokeWidth="1.2" strokeLinecap="round"/>

      {/* Bottom tier - right */}
      <path
        d="M31 32 C29 34, 28 36, 29 38 C30 40, 32 41, 33 38 C34 36, 33 34, 31 32 Z"
        fill="#7FB069"
        stroke="#5a8a4d"
        strokeWidth="1"
      />
      <path d="M29 34 Q27 35, 24 35" stroke="#5a8a4d" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

// Helper to get the right badge icon
export function getBadgeIcon(badgeType: string, size?: number) {
  switch (badgeType) {
    case 'first_record':
      return <FirstRecordBadge size={size} />;
    case '3_records':
      return <ThreeRecordsBadge size={size} />;
    case '7_records':
      return <SevenRecordsBadge size={size} />;
    case '30_records':
      return <ThirtyRecordsBadge size={size} />;
    default:
      return null;
  }
}
