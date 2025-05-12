import { useEVMContext } from "@/contexts/EVMContext/EVMContext";
import { useWalletContext } from "@/contexts/WalletContext/WalletContext";
import { useActiveEVMChainConfig } from "@/services/chains/hooks/useActiveEVMChainConfig";
import { cn } from "@/utils/shadcn";
import { Bars3Icon, WalletIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FC, useCallback, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChildTooltip } from "../base/ChildTooltip";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export const Navbar: FC = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { evmAccount } = useWalletContext();

  const navigation = useMemo(() => {
    const nav = [
      { name: "Arbiters", href: "/" },
      { name: "Transactions", href: "/transactions" },
      { name: "Compensations", href: "/compensations" },
      { name: "DApps", href: "/dapps" },
    ];

    if (evmAccount) nav.push({ name: "My dashboard", href: "/dashboard" });
    return nav;
  }, [evmAccount]);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center relative">
              <span className="text-xl font-bold text-gray-800">
                Arbiter Portal
              </span>
              <div
                className="absolute -bottom-1 text-sm text-primary cursor-help font-bold left-0"
                style={{ bottom: "0rem" }}
              >
                <ChildTooltip
                  title="Beta version"
                  tooltip="This is a beta version. Most functions are limited and usable coin amounts are capped."
                >
                  BETA
                </ChildTooltip>
              </div>
            </div>
            {/* Nav items, large screens only */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    item.href === location.pathname
                      ? "border-primary text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                    "inline-flex items-center border-b-2 px-1 pt-1 font-normal"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          {/* Wallet status/connection, large screens only */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Wallet />
          </div>
          <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild className="sm:hidden">
              <div className="ml-2 flex items-center sm:hidden">
                {/* Icon button to toggle mobile menu */}
                <Button variant="ghost">
                  {open && (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  )}
                  {!open && (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-background z-10 shadow-xl pb-3">
              {/* Mobile menu navigation */}
              <div className="space-y-1 pb-3 pt-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      item.href === location.pathname
                        ? "border-primary text-primary bg-primary/10"
                        : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700",
                      "block border-l-4 py-2 pl-2"
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Wallet status/connection */}
              <div className="flex items-center justify-center">
                <Wallet />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </>
  );
};

const Wallet: FC = () => {
  const { evmAccount } = useWalletContext();
  const activeChain = useActiveEVMChainConfig();
  const { connect } = useEVMContext();
  const [open, setOpen] = useState(false);
  const { disconnect } = useEVMContext();

  const handleDisconnect = useCallback(() => {
    setOpen(false);
    disconnect();
  }, [disconnect]);

  return (
    <>
      {evmAccount && (
        <Popover onOpenChange={setOpen} open={open}>
          <PopoverTrigger className="flex flex-row gap-2 items-center" asChild>
            <div>
              <span className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg cursor-pointer">
                {evmAccount.slice(0, 6)}...{evmAccount.slice(-4)}
              </span>
              <Button onClick={handleDisconnect} className="sm:hidden">
                Disconnect
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto hidden sm:block">
            <Button onClick={handleDisconnect}>
              Disconnect from: {activeChain?.name}
            </Button>
          </PopoverContent>
        </Popover>
      )}
      {!evmAccount && (
        <Button onClick={connect}>
          <WalletIcon className="h-5 w-5 mr-2" />
          Connect Wallet
        </Button>
      )}
    </>
  );
};
