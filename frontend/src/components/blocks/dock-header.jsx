import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { NavigationDock } from './navigation-dock';
import { cn } from '../../lib/utils';

const menuItems = [
    { name: 'Features', href: '#features' },
    { name: 'Benefits', href: '#benefits' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Verify', href: '/verify' },
];

export const DockHeader = () => {
    const [menuState, setMenuState] = React.useState(false);

    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className="fixed z-20 w-full px-2 group">
                <div className="mx-auto mt-2 max-w-6xl transition-all duration-300">
                    {/* Show traditional nav on mobile, dock on desktop */}
                    <div className="lg:hidden bg-black/50 rounded-2xl border border-gray-800 backdrop-blur-lg px-6">
                        <div className="relative flex flex-wrap items-center justify-between gap-6 py-3">
                            <div className="flex w-full justify-between">
                                <Link
                                    to="/"
                                    aria-label="home"
                                    className="flex items-center space-x-2">
                                    <Logo />
                                </Link>

                                <button
                                    onClick={() => setMenuState(!menuState)}
                                    aria-label={menuState === true ? 'Close Menu' : 'Open Menu'}
                                    className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5">
                                    <Menu className="group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                    <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                                </button>
                            </div>

                            <div className="bg-gray-900 group-data-[state=active]:block mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-gray-800 p-6 shadow-2xl">
                                <ul className="space-y-6 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <a
                                                href={item.href}
                                                className="text-gray-300 hover:text-blue-400 block duration-150">
                                                <span>{item.name}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex w-full flex-col space-y-3 mt-6">
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm">
                                        <Link to="/login">
                                            <span>Log In</span>
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700">
                                        <Link to="/register">
                                            <span>Sign Up</span>
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Show dock on desktop */}
                    <div className="hidden lg:block">
                        <NavigationDock />
                    </div>
                </div>
            </nav>
        </header>
    );
};

const Logo = () => {
    return (
        <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                DocuChain
            </span>
        </div>
    );
};
