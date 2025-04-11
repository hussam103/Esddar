import React from "react";

interface SARIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const SARIcon = ({ size = 24, ...props }: SARIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Official Saudi Riyal symbol based on SAMA design */}
      <path d="M90,52.5H73.8v33.3H57.6V52.5H30v-19h27.6V14.3h16.2v19.2H90V52.5z M68.8,42.5V33.5h-21V24.3h-7.8v9.2H27.8v9h12.2
        v29.3h7.8V42.5H68.8z M83.8,42.5v-9H68.8v9H83.8z M57.6,42.5h-9.8v33.3h9.8V42.5z"/>
    </svg>
  );
};