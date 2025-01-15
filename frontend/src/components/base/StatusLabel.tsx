import { FC } from "react";

export type StatusLabelColor = "none" | "green" | "yellow" | "red";

export const StatusLabel: FC<{
  title: string;
  color: StatusLabelColor;
}> = ({ title, color }) => {

  const colorStyles = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    none: ''
  }

  return <span className={`px-2 py-1 rounded text-sm font-normal ${colorStyles[color]}`}>
    {title}
  </span>
}