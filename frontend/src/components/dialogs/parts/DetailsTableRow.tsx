import { TableRow } from "@/components/ui/table";
import { FC, ReactNode } from "react";

export const DetailsTableRow: FC<{
  children: ReactNode;
}> = ({ children }) => {
  return (
    <TableRow>{children}</TableRow>
  )
}