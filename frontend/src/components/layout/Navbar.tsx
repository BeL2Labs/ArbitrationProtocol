import { Link, useLocation } from 'react-router-dom';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEVMContext } from '@/contexts/EVMContext/EVMContext';
import { useWalletContext } from '@/contexts/WalletContext/WalletContext';
import { WalletIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar() {
  const { evmAccount } = useWalletContext();
  const { connect } = useEVMContext();
  const location = useLocation();

  const navigation = [
    { name: 'Arbitrators', href: '/' },
    { name: 'Transactions', href: '/transactions' },
    { name: 'Compensations', href: '/compensations' },
    { name: 'DApps', href: '/dapps' },
    { name: 'My dashboard', href: '/dashboard' },
  ];

  return (
    <Disclosure as="nav" className="bg-white shadow">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <span className="text-xl font-bold text-gray-800">
                    Arbitrator Portal
                  </span>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={classNames(
                        item.href === location.pathname
                          ? 'border-primary text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                        'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium'
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <Button onClick={connect}>
                  {evmAccount
                    ? `${evmAccount.slice(0, 6)}...${evmAccount.slice(-4)}`
                    : 'Connect Wallet'}
                </Button>
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  to={item.href}
                  className={classNames(
                    item.href === location.pathname
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700',
                    'block border-l-4 py-2 pl-3 pr-4 text-base font-medium'
                  )}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>

            {/* Wallet status/connection */}
            <div className="flex items-center">
              {evmAccount ? (
                <span className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
                  {evmAccount.slice(0, 6)}...{evmAccount.slice(-4)}
                </span>
              ) : (
                <Button onClick={connect}>
                  <WalletIcon className="h-5 w-5 mr-2" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
