'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import navbarTree from '@/data/navbar_tree.json';

interface MenuItem {
  id: number;
  title: string;
  url: string;
  parent: string;
  object_id: string;
  object: string;
  children?: MenuItem[];
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileQuickLinksOpen, setMobileQuickLinksOpen] = useState(false);
  const [expandedMobileMenus, setExpandedMobileMenus] = useState<Record<number, boolean>>({});
  const quickLinksRef = useRef<HTMLDivElement>(null);

  // Filter links to split the menu and prevent it from wrapping to 2 lines
  // Removed "Highlights" from top bar titles as requested
  const topBarTitles = ['Library', 'Gallery', 'NIRF', 'Contact Us', 'Feedback'];

  // Custom sorting order to move "Best Practices" up (directly after "About Us")
  const mainNavOrder = [
    'Home',
    'About Us',
    'Best Practices',
    'Courses',
    'Departments',
    'Facilities',
    'Placements',
    'IQAC',
    'Students Corner'
  ];

  const topBarLinks = navbarTree.filter((item: any) =>
    topBarTitles.includes(item.title)
  );

  const mainNavLinks = navbarTree.filter((item: any) =>
    !topBarTitles.includes(item.title) && item.title !== 'Highlights'
  ).sort((a: any, b: any) => {
    const idxA = mainNavOrder.indexOf(a.title);
    const idxB = mainNavOrder.indexOf(b.title);
    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const toggleMobileSubmenu = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedMobileMenus((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const cleanUrl = (url: string, objectId: string) => {
    if (!url) return '#';
    if (objectId === '30') return '/contact-us';
    if (objectId === '140' || objectId === '144') return '#';

    // Check if external link
    if (url.startsWith('http') && !url.includes('localhost/drrzwc.in') && !url.includes('drrzwc.in')) {
      return url;
    }

    let clean = url.replace('http://localhost/drrzwc.in', '').replace('https://drrzwc.in', '');
    if (clean === '') clean = '/';
    if (clean.endsWith('/') && clean.length > 1) {
      clean = clean.substring(0, clean.length - 1);
    }
    return clean;
  };

  // Close mobile menus on click outside or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickLinksRef.current && !quickLinksRef.current.contains(event.target as Node)) {
        setMobileQuickLinksOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileQuickLinksOpen(false);
        setMobileMenuOpen(false);
      }
    };

    if (mobileQuickLinksOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileQuickLinksOpen]);

  // Close mobile menus on initial load / navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileQuickLinksOpen(false);
  }, []);

  const getHeaderMenuIcon = (title: string) => {
    switch (title.toLowerCase()) {
      case 'library':
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'gallery':
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'nirf':
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case 'contact us':
      case 'contact':
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'feedback':
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        );
      default:
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
    }
  };

  // Desktop Submenu component (recursive)
  const DesktopSubmenu = ({ items, depth = 1 }: { items: MenuItem[]; depth?: number }) => {
    const ulVisibilityClass =
      depth === 1
        ? 'top-full left-0 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 border-t-2 border-t-[#c5a059] rounded-b-md'
        : depth === 2
          ? 'top-0 left-full opacity-0 invisible translate-x-2 group-hover/sub1:opacity-100 group-hover/sub1:visible group-hover/sub1:translate-x-0 border-l-2 border-l-[#c5a059] rounded-r-md'
          : depth === 3
            ? 'top-0 left-full opacity-0 invisible translate-x-2 group-hover/sub2:opacity-100 group-hover/sub2:visible group-hover/sub2:translate-x-0 border-l-2 border-l-[#c5a059] rounded-r-md'
            : 'top-0 left-full opacity-0 invisible translate-x-2 group-hover/sub3:opacity-100 group-hover/sub3:visible group-hover/sub3:translate-x-0 border-l-2 border-l-[#c5a059] rounded-r-md';

    const liGroupClass =
      depth === 1
        ? 'relative group/sub1'
        : depth === 2
          ? 'relative group/sub2'
          : depth === 3
            ? 'relative group/sub3'
            : 'relative group/sub4';

    return (
      <ul
        className={`absolute bg-white/95 backdrop-blur-sm text-zinc-800 shadow-xl py-1.5 border border-zinc-150 min-w-[220px] transition-all duration-300 z-50 ${ulVisibilityClass}`}
      >
        {items.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const href = cleanUrl(item.url, item.object_id);

          return (
            <li key={item.id} className={liGroupClass}>
              {hasChildren ? (
                <div className="flex items-center justify-between px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-[#0a1d37] hover:text-[#c5a059] hover:pl-6 cursor-pointer transition-all duration-200 border-b border-zinc-100 last:border-0">
                  <span>{item.title}</span>
                  <svg className="w-3 h-3 transform -rotate-90" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <Link
                  href={href}
                  className="block px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-[#0a1d37] hover:text-[#c5a059] hover:pl-6 transition-all duration-200 border-b border-zinc-100 last:border-0"
                >
                  {item.title}
                </Link>
              )}
              {hasChildren && item.children && (
                <DesktopSubmenu items={item.children} depth={depth + 1} />
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  // Mobile Submenu component (recursive)
  const MobileSubmenu = ({ items, depth = 1 }: { items: MenuItem[]; depth?: number }) => {
    return (
      <ul className={`pl-4 bg-zinc-50 border-l border-[#c5a059]/40 w-full`}>
        {items.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = !!expandedMobileMenus[item.id];
          const href = cleanUrl(item.url, item.object_id);

          return (
            <li key={item.id} className="w-full">
              <div className="flex items-center justify-between py-2.5 border-b border-zinc-100">
                {hasChildren ? (
                  <button
                    onClick={(e) => toggleMobileSubmenu(item.id, e)}
                    className="flex-1 text-left text-sm font-medium text-zinc-700 hover:text-[#0a1d37]"
                  >
                    {item.title}
                  </button>
                ) : (
                  <Link
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-sm font-medium text-zinc-700 hover:text-[#0a1d37]"
                  >
                    {item.title}
                  </Link>
                )}

                {hasChildren && (
                  <button
                    onClick={(e) => toggleMobileSubmenu(item.id, e)}
                    className="p-1 text-zinc-500 hover:text-zinc-800"
                  >
                    <svg
                      className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>

              {hasChildren && isExpanded && item.children && (
                <MobileSubmenu items={item.children} depth={depth + 1} />
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <header className="w-full flex flex-col bg-white shadow-sm font-sans">
      {/* Top Utility Bar (Utility links split to keep primary navbar single-lined) */}
      <div className="w-full bg-[#0a1d37] border-b border-[#c5a059]/20 py-2 relative z-50">
        <div className="mx-auto px-4 md:px-12 flex justify-between items-center text-white">
          <div className="text-[9px] md:text-xs text-zinc-400 font-bold tracking-widest font-heading uppercase select-none">
            Affiliated to Dr. BAMU, Aurangabad
          </div>

          {/* Desktop utility links */}
          <ul className="hidden md:flex items-center space-x-3 md:space-x-4 divide-x divide-zinc-700/50">
            {topBarLinks.map((item: any) => {
              const href = cleanUrl(item.url, item.object_id);
              return (
                <li key={item.id} className="pl-3 md:pl-4 first:pl-0">
                  <Link
                    href={href}
                    className="text-[10px] md:text-sm font-semibold text-zinc-300 hover:text-[#c5a059] tracking-wide transition-colors duration-150 font-heading"
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Mobile Quick Links / Header Menus Button & Dropdown */}
          <div className="relative md:hidden" ref={quickLinksRef}>
            <button
              onClick={() => setMobileQuickLinksOpen(!mobileQuickLinksOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold text-[#c5a059] bg-[#c5a059]/10 hover:bg-[#c5a059]/20 active:bg-[#c5a059]/30 border border-[#c5a059]/40 rounded-full transition-all duration-200 font-heading shadow-xs select-none"
              aria-expanded={mobileQuickLinksOpen}
              aria-label="Toggle Header Menus"
            >
              <svg className="w-3.5 h-3.5 text-[#c5a059]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>Quick Links</span>
              <svg
                className={`w-3 h-3 text-[#c5a059] transition-transform duration-200 ${mobileQuickLinksOpen ? 'rotate-180' : ''
                  }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Mobile Header Menus Popup */}
            {mobileQuickLinksOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#0a1d37] border border-[#c5a059]/40 rounded-xl shadow-2xl p-2 z-50 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2.5 py-1.5 border-b border-zinc-700/60 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#c5a059] font-heading">
                    Header Menus
                  </span>
                </div>

                <div className="flex flex-col space-y-1">
                  {topBarLinks.map((item: any) => {
                    const href = cleanUrl(item.url, item.object_id);
                    return (
                      <Link
                        key={`header-menu-${item.id}`}
                        href={href}
                        onClick={() => setMobileQuickLinksOpen(false)}
                        className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-[#c5a059]/20 rounded-lg transition-colors font-heading group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[#c5a059] group-hover:scale-110 transition-transform">
                            {getHeaderMenuIcon(item.title)}
                          </span>
                          <span>{item.title}</span>
                        </div>
                        <svg className="w-3 h-3 text-zinc-500 group-hover:text-[#c5a059] group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logo Banner */}
      <div className="w-full bg-gradient-to-r from-[#0a1d37]/[0.02] via-[#c5a059]/[0.08] to-[#0a1d37]/[0.02] border-t-0 py-4 md:py-6 border-b border-zinc-100/80">
        <div className="mx-auto px-4 md:px-12">
          <Link href="/" className="flex flex-col md:flex-row items-center gap-4 md:gap-6 group text-decoration-none select-none">
            {/* Logo Wrapper */}
            <div className="flex-shrink-0 relative transition-all duration-500 ease-out group-hover:scale-105 group-hover:rotate-1">
              {/* Subtle backglow shadow for the logo */}
              <div className="absolute inset-0 bg-[#c5a059]/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <img
                src="/logo.png"
                alt="Dr. Rafiq Zakaria College for Women Logo"
                className="h-[75px] md:h-[95px] w-auto object-contain relative z-10"
              />
            </div>

            {/* Text Content */}
            <div className="flex flex-col text-center md:text-left gap-1 md:gap-1.5">
              {/* Campus Title */}
              <div className="text-[#c5a059] font-heading font-bold text-[10px] md:text-xs uppercase tracking-[0.25em] leading-none transition-colors duration-300 group-hover:text-[#0a1d37]">
                Dr. Rafiq Zakaria Campus
              </div>

              {/* College Title */}
              <h1 className="text-[#0a1d37] font-serif font-extrabold text-[17px] sm:text-xl md:text-2xl lg:text-3xl leading-normal transition-all duration-300">
                Dr. Rafiq Zakaria College for Women
              </h1>

              {/* Sub-titles / Certifications */}
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 sm:gap-3 text-zinc-500 font-sans text-[9px] md:text-[11px] font-semibold uppercase tracking-wider mt-0.5">
                <span className="bg-[#0a1d37]/5 px-2.5 py-0.5 rounded border border-[#0a1d37]/10 text-[#0a1d37] transition-all duration-300 group-hover:bg-[#0a1d37] group-hover:text-[#c5a059]">
                  NAAC Reaccredited B++
                </span>
                <span className="hidden sm:inline text-zinc-300">|</span>
                <span className="bg-zinc-100/80 px-2.5 py-0.5 rounded border border-zinc-200/50 transition-all duration-300 group-hover:border-[#c5a059]/30">
                  An ISO 14001:2015 & ISO 50000:2018 Certified
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="w-full bg-[#0a1d37] border-b border-[#c5a059]/20 relative z-40 shadow-md">
        <div className="mx-auto px-4 md:px-12 flex items-center justify-between md:justify-start">

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-3.5 text-white focus:outline-none flex items-center space-x-2"
            aria-label="Toggle Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
            <span className="text-sm font-semibold tracking-wider font-heading">Menu</span>
          </button>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex flex-wrap items-center">
            {mainNavLinks.map((item: any) => {
              const hasChildren = item.children && item.children.length > 0;
              const href = cleanUrl(item.url, item.object_id);

              return (
                <li key={item.id} className="relative group">
                  {hasChildren ? (
                    <div className="flex items-center space-x-1.5 px-4.5 py-4 text-base font-semibold text-white tracking-wide hover:bg-[#0f2b46] hover:text-[#c5a059] border-t-4 border-transparent hover:border-[#c5a059] cursor-pointer transition-all duration-200 font-heading">
                      <span>{item.title}</span>
                      <svg className="w-3 h-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <Link
                      href={href}
                      className="block px-4.5 py-4 text-base font-semibold text-white tracking-wide hover:bg-[#0f2b46] hover:text-[#c5a059] border-t-4 border-transparent hover:border-[#c5a059] transition-all duration-200 font-heading"
                    >
                      {item.title}
                    </Link>
                  )}

                  {hasChildren && item.children && (
                    <DesktopSubmenu items={item.children} />
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-xl z-50 border-t border-zinc-200 max-h-[80vh] overflow-y-auto">
            {/* Header Menus Quick Shortcuts Bar */}
            <div className="p-3 bg-zinc-50 border-b border-zinc-200">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-heading mb-2 flex items-center justify-between">
                <span>Header Menus</span>
                <span className="text-[9px] bg-[#c5a059]/20 text-[#856523] px-1.5 py-0.5 rounded font-semibold font-sans">
                  Quick Access
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {topBarLinks.map((item: any) => {
                  const href = cleanUrl(item.url, item.object_id);
                  return (
                    <Link
                      key={`shortcut-${item.id}`}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white border border-zinc-200/80 hover:border-[#c5a059] hover:bg-[#c5a059]/5 transition-all text-xs font-semibold text-zinc-700 hover:text-[#0a1d37] font-heading shadow-xs"
                    >
                      <span className="text-[#c5a059] flex-shrink-0">
                        {getHeaderMenuIcon(item.title)}
                      </span>
                      <span className="truncate">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Main Navigation List */}
            <ul className="px-4 py-2 flex flex-col">
              {mainNavLinks.map((item: any) => {
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = !!expandedMobileMenus[item.id];
                const href = cleanUrl(item.url, item.object_id);

                return (
                  <li key={item.id} className="w-full">
                    <div className="flex items-center justify-between py-3.5 border-b border-zinc-200">
                      {hasChildren ? (
                        <button
                          onClick={(e) => toggleMobileSubmenu(item.id, e)}
                          className="flex-1 text-left text-sm font-semibold text-zinc-800 tracking-wide hover:text-[#c5a059] font-heading"
                        >
                          {item.title}
                        </button>
                      ) : (
                        <Link
                          href={href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex-1 text-sm font-semibold text-zinc-800 tracking-wide hover:text-[#c5a059] font-heading"
                        >
                          {item.title}
                        </Link>
                      )}

                      {hasChildren && (
                        <button
                          onClick={(e) => toggleMobileSubmenu(item.id, e)}
                          className="p-1 text-zinc-500 hover:text-[#c5a059]"
                        >
                          <svg
                            className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                              }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {hasChildren && isExpanded && item.children && (
                      <MobileSubmenu items={item.children} />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
}
