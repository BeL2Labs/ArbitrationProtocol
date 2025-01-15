import { TableCell } from "@/components/ui/table";
import { FC, ReactNode } from "react";

export const DetailsTableCellWithLabel: FC<{
  children: ReactNode;
}> = ({ children }) => {
  return (
    <TableCell className="font-bold w-0 whitespace-nowrap p-0 pr-6">{children}</TableCell>
  )
}