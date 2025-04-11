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
      <path d="M86.6,56.3c-4.2,0-7.5,0-11.7,0c-0.1,0-2.6,0-2.7,0c0,9.1,0,18.2,0,27.3c-1.6,0-3.2,0-4.8,0c-3,0-6,0-9,0
        c0-9.2,0-18.4,0-27.8c-5.7,0-11.4,0-17.2,0c0-8.2,0-16.3,0-24.7c5.7,0,11.3,0,17.1,0c0-4,0-8,0-12c0-2.9,0-5.8,0-8.7
        c5.5,0,11,0,16.5,0c0,6.7,0,13.5,0,20.3c4.8,0,9.5,0,14.2,0c0,8.6,0,17.2,0,25.7C88.1,56.3,87.3,56.3,86.6,56.3z"/>
    </svg>
  );
};