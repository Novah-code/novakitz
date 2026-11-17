/**
 * Icons for the settings menu and sheet. One stroke weight, round caps, 24-box,
 * drawn here once so the menu, the sheet and the gear button agree.
 */

type IconProps = { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

// Eight teeth on a ring, drawn once as a single outline. The hub is a separate
// circle so the stroke stays one weight everywhere.
const GEAR_PATH =
  'M10.13 5.25 L10.45 2.73 L13.55 2.73 L13.87 5.25 A7.00 7.00 0 0 1 15.45 5.91 L17.46 4.35 L19.65 6.54 L18.09 8.55 A7.00 7.00 0 0 1 18.75 10.13 L21.27 10.45 L21.27 13.55 L18.75 13.87 A7.00 7.00 0 0 1 18.09 15.45 L19.65 17.46 L17.46 19.65 L15.45 18.09 A7.00 7.00 0 0 1 13.87 18.75 L13.55 21.27 L10.45 21.27 L10.13 18.75 A7.00 7.00 0 0 1 8.55 18.09 L6.54 19.65 L4.35 17.46 L5.91 15.45 A7.00 7.00 0 0 1 5.25 13.87 L2.73 13.55 L2.73 10.45 L5.25 10.13 A7.00 7.00 0 0 1 5.91 8.55 L4.35 6.54 L6.54 4.35 L8.55 5.91 A7.00 7.00 0 0 1 10.13 5.25 Z';

export const GearIcon = ({ size = 24 }: IconProps) => (
  <svg {...base(size)} strokeWidth={1.6} strokeLinecap={undefined}>
    <path d={GEAR_PATH} />
    <circle cx="12" cy="12" r="2.9" />
  </svg>
);

export const PersonIcon = ({ size = 22 }: IconProps) => (
  <svg {...base(size)} strokeWidth={1.8}>
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M5 19.5c.9-3.6 3.6-5.4 7-5.4s6.1 1.8 7 5.4" />
  </svg>
);

export const SparkIcon = ({ size = 22 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 3.5c.7 3.7 2.3 5.3 6 6-3.7.7-5.3 2.3-6 6-.7-3.7-2.3-5.3-6-6 3.7-.7 5.3-2.3 6-6Z" />
    <path d="M18.5 15.5v4M16.5 17.5h4" />
  </svg>
);

export const StarIcon = ({ size = 22 }: IconProps) => (
  <svg {...base(size)}>
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
  </svg>
);

export const BellIcon = ({ size = 22 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15L6 16.5Z" />
    <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
  </svg>
);

export const GlobeIcon = ({ size = 22 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.4 2.4 3.4 5.3 3.4 8.5S14.400 18.100 12 20.500C9.600 18.100 8.600 15.200 8.600 12S9.600 5.900 12 3.500Z" />
  </svg>
);

export const BagIcon = ({ size = 22 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M6 7.5h12l1 12.5H5L6 7.5Z" />
    <path d="M9 10V6.8a3 3 0 0 1 6 0V10" />
  </svg>
);

export const MailIcon = ({ size = 22 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
    <path d="m4.5 7.5 7.5 5.8 7.5-5.8" />
  </svg>
);

export const CameraIcon = ({ size = 22 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="3.7" />
    <circle cx="16.9" cy="7.1" r=".6" fill="currentColor" />
  </svg>
);

export const DocIcon = ({ size = 22 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M7 3.5h7l4 4v13H7v-17Z" />
    <path d="M14 3.5v4h4M9.800 12h5.400M9.800 15.500h5.400" />
  </svg>
);

export const LogoutIcon = ({ size = 22 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M10 4.5H6.5a1.500 1.500 0 0 0-1.500 1.500v12a1.500 1.500 0 0 0 1.500 1.500H10" />
    <path d="M15 8.500 18.500 12 15 15.500M18.500 12H9.500" />
  </svg>
);

export const ChevronIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)} strokeWidth={2}>
    <path d="m9.500 6 6 6-6 6" />
  </svg>
);

export const CheckIcon = ({ size = 22 }: IconProps) => (
  <svg {...base(size)} strokeWidth={2.2}>
    <path d="m5.500 12.500 4.200 4.200L18.500 7.500" />
  </svg>
);
