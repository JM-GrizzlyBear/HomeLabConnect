import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <path d="M12 14.5v2" />
    </svg>
  );
}

export function TestTubeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 3h6" />
      <path d="M10 3v13.5a2 2 0 0 0 4 0V3" />
      <path d="M10 10h4" />
      <path d="M17.5 7.5 20 5M18.5 11H21M17.5 14.5 20 17" />
    </svg>
  );
}

/** Logo mark: a drop inside a house outline — home + lab. */
export function LogoMark(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden {...props}>
      <rect width="32" height="32" rx="9" className="fill-brand-600" />
      <path
        d="M8 15.5 16 9l8 6.5V23a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 8 23Z"
        fill="none"
        stroke="white"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M16 13.5c-1.6 2.2-2.6 3.6-2.6 4.9a2.6 2.6 0 0 0 5.2 0c0-1.3-1-2.7-2.6-4.9Z"
        fill="white"
      />
    </svg>
  );
}
