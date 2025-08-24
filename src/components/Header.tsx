import { ChangeEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Switch } from './ui';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderProps {
    mode: "hobby" | "business";
    currency: string;
    isDarkTheme: boolean;
    onModeToggle: (value: boolean) => void;
    onCurrencyChange: (currency: string) => void;
    onThemeChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function Header({
                           mode,
                           currency,
                           isDarkTheme,
                           onModeToggle,
                           onCurrencyChange,
                           onThemeChange
                       }: HeaderProps) {
    const { t } = useTranslation();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        {
            path: '/',
            label: t('navigation.calculator', 'Calculator'),
            icon: (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                >
                    {/* Calculator Icon */}
                    <path d="M7 2C5.9 2 5 2.9 5 4V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V4C19 2.9 18.1 2 17 2H7ZM7 4H17V8H7V4ZM7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10ZM7 14H9V16H7V14ZM11 14H13V16H11V14ZM15 14H17V20H15V14ZM7 18H9V20H7V18ZM11 18H13V20H11V18Z"/>
                </svg>
            )
        },
        {
            path: '/profiles',
            label: t('navigation.profiles', 'Material Profiles'),
            icon: (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                >
                    {/* Material Layers/Profiles Icon */}
                    <path d="M12 2L2 7L12 12L22 7L12 2ZM2 17L12 22L22 17L18.5 15L12 18L5.5 15L2 17ZM2 12L12 17L22 12L18.5 10L12 13L5.5 10L2 12Z"/>
                </svg>
            )
        }
    ];

    return (
        <header className="mb-8">
            <div className="navbar bg-base-100 shadow-sm border-b border-base-300 mb-6 rounded-lg px-2 sm:px-4">
                <div className="navbar-start">
                    {/* Mobile Burger Menu - Zeigt auf kleinen Bildschirmen, versteckt auf großen */}
                    <div className="dropdown lg:hidden">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
                            </svg>
                        </div>
                        <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-64 p-2 shadow">
                            {navItems.map((item) => (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={`gap-3 transition-all duration-200 ${
                                            isActive(item.path)
                                                ? 'active bg-primary text-primary-content'
                                                : ''
                                        }`}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                            {/* Mobile-only controls in dropdown */}
                            <div className="divider my-2"></div>
                            <li className="menu-title">Settings</li>
                            <li>
                                <div className="flex items-center justify-between gap-2 px-2">
                                    <span className="text-sm flex-shrink-0">Language:</span>
                                    <div className="flex-shrink-0">
                                        <LanguageSwitcher />
                                    </div>
                                </div>
                            </li>
                            <li>
                                <div className="flex items-center justify-between gap-2 px-2">
                                    <span className="text-sm flex-shrink-0">Currency:</span>
                                    <select
                                        className="select select-xs select-bordered w-20 flex-shrink-0"
                                        value={currency}
                                        onChange={(e) => onCurrencyChange(e.target.value)}
                                    >
                                        <option>EUR</option>
                                        <option>USD</option>
                                        <option>GBP</option>
                                    </select>
                                </div>
                            </li>
                            <li>
                                <div className="flex flex-col gap-2 px-2">
                                    <span className="text-sm">Mode:</span>
                                    <Switch
                                        checked={mode === "business"}
                                        onChange={onModeToggle}
                                        labelLeft={t('app.modes.hobby')}
                                        labelRight={t('app.modes.business')}
                                    />
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Brand/Logo - responsive text size */}
                    <Link to="/" className="btn btn-ghost text-lg sm:text-xl truncate">
                        <span className="hidden sm:inline">{t('app.title')}</span>
                        <span className="sm:hidden">3D Print Calc</span>
                    </Link>
                </div>

                {/* Desktop Navigation - Zeigt nur auf großen Bildschirmen */}
                <div className="navbar-center hidden lg:flex">
                    <ul className="menu menu-horizontal px-1">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`gap-2 transition-all duration-200 hover:scale-105 ${
                                        isActive(item.path)
                                            ? 'active bg-primary text-primary-content'
                                            : ''
                                    }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Right side controls - Responsive */}
                <div className="navbar-end flex-shrink-0">
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Theme toggle - immer sichtbar, kleinere Größe auf mobile */}
                        <label className="swap swap-rotate flex-shrink-0">
                            <input
                                type="checkbox"
                                className="theme-controller"
                                checked={isDarkTheme}
                                onChange={onThemeChange}
                            />
                            <svg className="swap-off h-5 w-5 sm:h-6 sm:w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
                            </svg>
                            <svg className="swap-on h-5 w-5 sm:h-6 sm:w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
                            </svg>
                        </label>

                        {/* Tablet and Desktop controls - versteckt auf kleinen Bildschirmen */}
                        <div className="hidden md:flex items-center gap-2 lg:gap-3">
                            <LanguageSwitcher />

                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-base-content/70 hidden xl:block">Currency:</span>
                                <select
                                    className="select select-sm select-bordered min-w-0 w-16 lg:w-20"
                                    value={currency}
                                    onChange={(e) => onCurrencyChange(e.target.value)}
                                >
                                    <option>EUR</option>
                                    <option>USD</option>
                                    <option>GBP</option>
                                </select>
                            </div>

                            <Switch
                                checked={mode === "business"}
                                onChange={onModeToggle}
                                labelLeft={t('app.modes.hobby')}
                                labelRight={t('app.modes.business')}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}