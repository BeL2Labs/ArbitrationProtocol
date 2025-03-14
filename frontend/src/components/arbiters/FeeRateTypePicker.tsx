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

export type FeeRateType = "ela" | "btc";

/**
 * Lets user choose between ELA fee rate and BTC fee rate when registering or editing an arbiter.
 */
export const FeeRateTypePicker: FC<{
  value: FeeRateType;
  className?: string;
  onChange: (value: FeeRateType) => void;
}> = ({ value, onChange, className }) => {
  const activeChain = useActiveEVMChainConfig();

  const feeRateTypes: { value: FeeRateType, label: string }[] = useMemo(() => {
    const types: { value: FeeRateType, label: string }[] = [
      {
        value: "ela",
        label: `Fee rate in ${activeChain?.nativeCurrency.symbol}`,
      },
      {
        value: "btc",
        label: "Fee rate in BTC",
      }
    ];

    return types;
  }, [activeChain]);

  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value
            ? feeRateTypes.find((framework) => framework.value === value)?.label
            : "Select Fee Rate Type"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {feeRateTypes.map((framework) => (
                <CommandItem
                  key={framework.value}
                  value={framework.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue as FeeRateType);
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