import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useActiveEVMChainConfig } from "@/services/chains/hooks/useActiveEVMChainConfig";
import { cn } from "@/utils/shadcn";
import { Check, ChevronsUpDown } from "lucide-react";
import { FC, useMemo, useState } from "react";

export type TransactionFilterType = "all" | "with-btc-fee-balance";

export const TransactionFilter: FC<{
  value: TransactionFilterType;
  className?: string;
  onChange: (value: TransactionFilterType) => void;
}> = ({ value, onChange, className }) => {
  const activeChain = useActiveEVMChainConfig();

  const filters: { value: TransactionFilterType, label: string }[] = useMemo(() => {
    const types: { value: TransactionFilterType, label: string }[] = [
      {
        value: "all",
        label: `All transactions`,
      },
      {
        value: "with-btc-fee-balance",
        label: "BTC Fees to claim",
      }
    ];

    return types;
  }, []);

  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {value
            ? filters.find((framework) => framework.value === value)?.label
            : "Transaction Type"}
          <ChevronsUpDown className="opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {filters.map((framework) => (
                <CommandItem
                  key={framework.value}
                  value={framework.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue as TransactionFilterType);
                    setOpen(false);
                  }}
                >
                  {framework.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === framework.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}