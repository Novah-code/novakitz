'use client';

/**
 * Vector stand-in for the painted scene.
 *
 * HomeScene prefers the real artwork in public/scenes/ and falls back to this
 * when the file is missing, so the home screen is never broken while art is in
 * progress. Shapes and palette follow the reference so layout work done against
 * the fallback still holds once the painting drops in.
 */
export default function SceneArt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="scene-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3E97E8" />
          <stop offset="70%" stopColor="#79BFF3" />
          <stop offset="100%" stopColor="#AEDCF9" />
        </linearGradient>
        <linearGradient id="scene-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5FC24E" />
          <stop offset="100%" stopColor="#3E9E34" />
        </linearGradient>
      </defs>

      {/* Sky and sun */}
      <rect width="400" height="200" fill="url(#scene-sky)" />
      <circle cx="248" cy="72" r="17" fill="#FFE23D" />

      {/* Clouds, banked either side of the horizon */}
      <g fill="#FFFFFF">
        <ellipse cx="52" cy="176" rx="62" ry="30" />
        <ellipse cx="104" cy="184" rx="46" ry="22" />
        <ellipse cx="330" cy="182" rx="58" ry="26" />
        <ellipse cx="286" cy="190" rx="38" ry="18" />
      </g>

      {/* Rolling hills */}
      <path d="M0 200 Q 70 150 150 186 T 400 172 L400 210 L0 210 Z" fill="#6FC55F" />
      <path d="M0 208 Q 120 176 240 200 T 400 196 L400 240 L0 240 Z" fill="#57B646" />

      {/* Meadow */}
      <rect y="206" width="400" height="194" fill="url(#scene-grass)" />

      {/* Pond */}
      <ellipse cx="288" cy="272" rx="62" ry="20" fill="#3E97E8" />
      <ellipse cx="288" cy="269" rx="48" ry="13" fill="#5EACEF" />

      {/* Conifer stand behind the house */}
      <g fill="#2F8A47">
        <path d="M96 244 L110 196 L124 244 Z" />
        <path d="M120 250 L136 194 L152 250 Z" />
        <path d="M226 246 L240 200 L254 246 Z" />
        <path d="M250 250 L262 208 L274 250 Z" />
      </g>

      {/* Cottage */}
      <g>
        <rect x="152" y="222" width="76" height="42" fill="#F6E7AC" />
        <path d="M144 224 L190 194 L236 224 Z" fill="#F2703C" />
        <rect x="182" y="240" width="16" height="24" fill="#4A7FD4" />
        <rect x="160" y="234" width="14" height="13" fill="#8FC9E8" />
        <rect x="206" y="234" width="14" height="13" fill="#8FC9E8" />
      </g>

      {/* Broadleaf tree */}
      <g>
        <rect x="326" y="236" width="7" height="26" fill="#8B5E3C" />
        <circle cx="330" cy="226" r="26" fill="#3FA055" />
        <circle cx="316" cy="234" r="17" fill="#4AAE5D" />
      </g>

      {/* Wildflowers */}
      <g>
        <circle cx="196" cy="330" r="7" fill="#FFD93D" />
        <circle cx="232" cy="344" r="7" fill="#F2703C" />
        <circle cx="264" cy="330" r="6" fill="#FFFFFF" />
        <circle cx="160" cy="348" r="6" fill="#FFD93D" />
      </g>
    </svg>
  );
}
