import { FC, ReactNode } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";

export const ChildTooltip: FC<{
  active?: boolean;
  title: string;
  tooltip: string;
  children: ReactNode;
}> = ({ active = true, children, title, tooltip }) => {

  if (!active)
    return children;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-96">
        <p className="text-base text-primary font-bold">{title}</p>
        <p className="text-sm font-normal text-justify">{tooltip}</p>
      </HoverCardContent>
    </HoverCard>
  )
}