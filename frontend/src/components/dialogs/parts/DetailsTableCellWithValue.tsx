import { TableCell } from "@/components/ui/table";
import { FC, ReactNode } from "react";

export const DetailsTableCellWithValue: FC<{
  children: ReactNode;
}> = ({ children }) => {
  return (
    <TableCell className="w-auto flex flex-row items-center p-0 min-h-10">{children}</TableCell>
  )
}