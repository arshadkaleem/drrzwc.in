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
  const [expandedMobileMenus, setExpandedMobileMenus] = useState<Record<number, boolean>>({});

  // Filter links to split the menu and prevent it from wrapping to 2 lines
  // Removed "Highlights" from top bar titles as requested
  const topBarTitles = ['Library', 'Gallery', 'NIRF', 'Contact Us', 'Feedback'];
  
  // Custom sorting order to move "Best practices" up (directly after "About Us")
  const mainNavOrder = [
    'Home',
    'About Us',
    'Best practices',
    'Courses',
    'Departments',
    'Facilities',
    'Placements',
    'IQAC',
    'STUDENTS CORNER'
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

  // Mobile menu links (Main navigation first, followed by utility links, omitting Highlights)
  const mobileNavLinks = [...mainNavLinks, ...topBarLinks];

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

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, []);

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
                <div className="flex items-center justify-between px-5 py-2.5 text-[11px] font-semibold text-zinc-700 hover:bg-[#0a1d37] hover:text-[#c5a059] hover:pl-6 cursor-pointer transition-all duration-200 border-b border-zinc-100 last:border-0">
                  <span>{item.title}</span>
                  <svg className="w-3 h-3 transform -rotate-90" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <Link
                  href={href}
                  className="block px-5 py-2.5 text-[11px] font-semibold text-zinc-700 hover:bg-[#0a1d37] hover:text-[#c5a059] hover:pl-6 transition-all duration-200 border-b border-zinc-100 last:border-0"
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
                      className={`w-4 h-4 transform transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
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
      <div className="w-full bg-[#0a1d37] border-b border-[#c5a059]/20 py-2">
        <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center text-white">
          <div className="text-[10px] md:text-xs text-zinc-400 font-bold tracking-widest font-heading uppercase select-none">
            Affiliated to Dr. BAMU, Aurangabad
          </div>
          <ul className="flex items-center space-x-3 md:space-x-4 divide-x divide-zinc-700/50">
            {topBarLinks.map((item: any) => {
              const href = cleanUrl(item.url, item.object_id);
              return (
                <li key={item.id} className="pl-3 md:pl-4 first:pl-0">
                  <Link
                    href={href}
                    className="text-[10px] md:text-[11px] font-bold text-zinc-300 hover:text-[#c5a059] uppercase tracking-wider transition-colors duration-150 font-heading"
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Logo Banner */}
      <div className="w-full bg-gradient-to-r from-[#0a1d37]/[0.02] via-[#c5a059]/[0.08] to-[#0a1d37]/[0.02] border-t-0 py-4 md:py-6 border-b border-zinc-100/80">
        <div className="max-w-[1200px] mx-auto px-4">
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
              <h1 className="text-[#0a1d37] font-serif font-extrabold text-[17px] sm:text-xl md:text-2xl lg:text-3xl leading-tight transition-all duration-300">
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
      <nav className="w-full bg-[#0a1d37] border-b border-[#c5a059]/20 relative z-50 shadow-md">
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between md:justify-start">
          
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
            <span className="text-sm font-bold tracking-wider font-heading">MENU</span>
          </button>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex flex-wrap items-center">
            {mainNavLinks.map((item: any) => {
              const hasChildren = item.children && item.children.length > 0;
              const href = cleanUrl(item.url, item.object_id);
              
              return (
                <li key={item.id} className="relative group">
                  {hasChildren ? (
                    <div className="flex items-center space-x-1.5 px-5 py-4 text-[11px] font-bold text-white uppercase tracking-widest hover:bg-[#0f2b46] hover:text-[#c5a059] border-t-4 border-transparent hover:border-[#c5a059] cursor-pointer transition-all duration-200 font-heading">
                      <span>{item.title}</span>
                      <svg className="w-3 h-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <Link
                      href={href}
                      className="block px-5 py-4 text-[11px] font-bold text-white uppercase tracking-widest hover:bg-[#0f2b46] hover:text-[#c5a059] border-t-4 border-transparent hover:border-[#c5a059] transition-all duration-200 font-heading"
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
            <ul className="px-4 py-2 flex flex-col">
              {mobileNavLinks.map((item: any) => {
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = !!expandedMobileMenus[item.id];
                const href = cleanUrl(item.url, item.object_id);

                return (
                  <li key={item.id} className="w-full">
                    <div className="flex items-center justify-between py-3.5 border-b border-zinc-200">
                      {hasChildren ? (
                        <button
                          onClick={(e) => toggleMobileSubmenu(item.id, e)}
                          className="flex-1 text-left text-sm font-bold text-zinc-800 uppercase tracking-widest hover:text-[#c5a059] font-heading"
                        >
                          {item.title}
                        </button>
                      ) : (
                        <Link
                          href={href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex-1 text-sm font-bold text-zinc-800 uppercase tracking-widest hover:text-[#c5a059] font-heading"
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
                            className={`w-5 h-5 transform transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
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
