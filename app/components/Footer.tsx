import Link from 'next/link';
import data from '@/data/extracted_data.json';

interface MenuItem {
  id: number;
  title: string;
  url: string;
  parent: string;
  object_id: string;
  object: string;
}

export default function Footer() {
  const campusMenu = (data.menus.campus || []) as MenuItem[];
  const quickLinksMenu = (data.menus['footer-links'] || []) as MenuItem[];

  const cleanUrl = (url: string, objectId: string) => {
    if (!url) return '#';
    if (objectId === '30') return '/contact-us';
    
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

  return (
    <footer className="w-full bg-[#070e19] border-t-4 border-[#c5a059] text-white pt-12 pb-8 mt-auto font-sans">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-zinc-800">
          
          {/* Column 1: Address & Social */}
          <div className="flex flex-col pr-0 md:pr-8 border-r-0 md:border-r border-zinc-800 border-dashed">
            <h4 className="border-b border-zinc-800 pb-3 text-sm font-semibold uppercase tracking-widest mb-4 font-heading text-[#c5a059]">
              College Address
            </h4>
            <div className="text-[13px] text-zinc-300 space-y-2 leading-relaxed">
              <p>Navkhanda, Jubilee Park,</p>
              <p>Aurangabad-431001.</p>
              <p className="pt-2">
                <span className="font-semibold text-white">E-Mail:</span> principal@drrzwc.in
              </p>
            </div>
            
            <h4 className="border-b border-zinc-800 pb-3 text-sm font-semibold uppercase tracking-widest mt-6 mb-4 font-heading text-[#c5a059]">
              Get Social
            </h4>
            <div className="flex items-center space-x-4">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-[#c5a059] transition-all duration-200"
                aria-label="Facebook"
              >
                <i className="fa fa-facebook-square text-3xl" aria-hidden="true"></i>
              </a>
            </div>
          </div>

          {/* Column 2: Campus Links */}
          <div className="flex flex-col px-0 md:px-8 border-r-0 md:border-r border-zinc-800 border-dashed">
            <h4 className="border-b border-zinc-800 pb-3 text-sm font-semibold uppercase tracking-widest mb-4 font-heading text-[#c5a059]">
              Campus Links
            </h4>
            <ul className="space-y-2.5">
              {campusMenu.map((item) => (
                <li key={item.id} className="flex items-center text-[13px] text-zinc-300">
                  <span className="text-[#c5a059] mr-2">»</span>
                  <Link
                    href={cleanUrl(item.url, item.object_id)}
                    className="hover:text-[#c5a059] hover:pl-1 transition-all duration-200"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div className="flex flex-col pl-0 md:pl-8">
            <h4 className="border-b border-zinc-800 pb-3 text-sm font-semibold uppercase tracking-widest mb-4 font-heading text-[#c5a059]">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {quickLinksMenu.map((item) => (
                <li key={item.id} className="flex items-center text-[13px] text-zinc-300">
                  <span className="text-[#c5a059] mr-2">»</span>
                  <Link
                    href={cleanUrl(item.url, item.object_id)}
                    className="hover:text-[#c5a059] hover:pl-1 transition-all duration-200"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Footer Bottom Copyright */}
        <div className="pt-6 text-center text-xs text-zinc-400">
          <p>
            Copyright © {new Date().getFullYear()} Dr. Rafiq Zakaria College for Women. All rights reserved. | Designed by{' '}
            <a
              href="https://mokshasolutions.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#c5a059] underline transition-colors"
            >
              Moksha Solutions
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
