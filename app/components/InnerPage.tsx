'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import data from '@/data/extracted_data.json';

interface PageData {
  id: number;
  slug: string;
  title: string;
  content: string;
  template?: string;
}

interface InnerPageProps {
  page: PageData;
}

interface GalleryImage {
  fullUrl: string;
  thumbnailUrl: string;
  title: string;
  isVideo?: boolean;
}

// Extract gallery items from WordPress HTML content (used for dedicated gallery page)
function extractGalleryImages(html: string): GalleryImage[] {
  const images: GalleryImage[] = [];
  const itemRegex = /<dl[^>]*class=['"]gallery-item['"][^>]*>([\s\S]*?)<\/dl>/g;
  let match;

  while ((match = itemRegex.exec(html)) !== null) {
    const itemContent = match[1];

    // Extract href (full resolution)
    const hrefMatch = /href=['"]([^'"]+)['"]/i.exec(itemContent);
    // Extract img src (thumbnail/medium)
    const srcMatch = /<img[^>]+src=['"]([^'"]+)['"]/i.exec(itemContent);
    // Extract img alt or title
    const altMatch = /alt=['"]([^'"]*)['"]/i.exec(itemContent);
    const titleMatch = /title=['"]([^'"]*)['"]/i.exec(itemContent);

    if (hrefMatch && srcMatch) {
      let fullUrl = hrefMatch[1];
      fullUrl = fullUrl.replace('https://drrzwc.in', '').replace('http://localhost/drrzwc.in', '');
      const thumbnailUrl = fullUrl; // Use the same full image as the thumbnail

      const title = titleMatch ? titleMatch[1] : (altMatch ? altMatch[1] : '');

      images.push({
        fullUrl,
        thumbnailUrl,
        title: title || 'College Gallery Photo'
      });
    }
  }

  // Fallback for Elementor or plain image anchor links
  if (images.length === 0) {
    const imgLinkRegex = /<a[^>]+href=['"]([^'"]+(?:\.jpg|\.jpeg|\.png|\.gif))['"][^>]*>\s*<img[^>]+src=['"]([^'"]+)['"]/gi;
    let fallbackMatch;
    while ((fallbackMatch = imgLinkRegex.exec(html)) !== null) {
      let fullUrl = fallbackMatch[1];
      fullUrl = fullUrl.replace('https://drrzwc.in', '').replace('http://localhost/drrzwc.in', '');
      const thumbnailUrl = fullUrl; // Use the same full image as the thumbnail

      images.push({
        fullUrl,
        thumbnailUrl,
        title: 'College Gallery Photo'
      });
    }
  }

  return images;
}

export default function InnerPage({ page }: InnerPageProps) {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxImages, setLightboxImages] = useState<GalleryImage[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');

  const cleanHtmlContent = (html: string) => {
    if (!html) return '';
    let cleaned = html;

    // Strip inline stylesheet blocks to prevent them from overriding global styling rules
    cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // 1. Replace WordPress Admin AJAX PDF viewer with native direct PDF links
    cleaned = cleaned.replace(
      /iframe[^>]*src=["'](?:https?:\/\/drrzwc\.in|http:\/\/localhost\/drrzwc\.in)?\/wp-admin\/admin-ajax\.php\?action=get_viewer&amp;?file=([^"'\s#]+)(?:#[^"'\s]*)?["']/gi,
      (match, fileParam) => {
        const decoded = decodeURIComponent(fileParam);
        const relative = decoded
          .replace('https://drrzwc.in', '')
          .replace('http://localhost/drrzwc.in', '');
        return `iframe src="${relative}" style="width: 100%; height: 600px; border: none;"`;
      }
    );

    // 2. Replace absolute site domains with relative routes
    cleaned = cleaned.replace(/https?:\/\/drrzwc\.in/gi, '');
    cleaned = cleaned.replace(/http:\/\/localhost\/drrzwc\.in/gi, '');

    // Replace non-image href in anchor links enclosing an img tag with the img src itself (e.g. for WordPress attachment pages)
    cleaned = cleaned.replace(
      /(<a\s+[^>]*href=["'])([^"']*)(["'][^>]*>\s*<img\s+[^>]*src=["'])([^"']*)(["'])/gi,
      (match, startHref, href, mid, src, endSrc) => {
        const isHrefImage = /\.(?:jpe?g|png|gif|webp|bmp)/i.test(href);
        const isSrcImage = /\.(?:jpe?g|png|gif|webp|bmp)/i.test(src);
        if (!isHrefImage && isSrcImage) {
          return startHref + src + mid + src + endSrc;
        }
        return match;
      }
    );

    // Replace thumbnail src with parent anchor href for image links
    cleaned = cleaned.replace(
      /(<a\s+[^>]*href=["']([^"']+\.(?:jpe?g|png|gif|webp|bmp))["'][^>]*>\s*<img\s+[^>]*src=["'])([^"']*)(["'])/gi,
      (match, prefix, href, src, quote) => {
        return prefix + href + quote;
      }
    );

    // Remove WordPress clear-both breaks inside galleries to allow grid/float columns to align correctly
    cleaned = cleaned.replace(/<br\s+style=['"]clear:\s*both;?['"]\s*\/?>/gi, '');

    // Normalize uploads directory urls
    cleaned = cleaned.replace(/\/wp-content\/uploads/gi, '/wp-content/uploads');

    // 3. Remove forced download attributes and set document/upload links to open in a new tab
    cleaned = cleaned.replace(/<a\s+([^>]*)\bdownload(?:=["'][^"']*["'])?\s*/gi, '<a $1 ');

    cleaned = cleaned.replace(
      /<a\s+([^>]*href=["'][^"']+(?:\.(?:pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv)|\/wp-content\/uploads\/[^"']+)(?:["'#?][^"']*)?["'][^>]*)>/gi,
      (match, attributes) => {
        let updated = attributes;
        if (!/target=/i.test(updated)) {
          updated += ' target="_blank"';
        } else {
          updated = updated.replace(/target=["'][^"']*["']/i, 'target="_blank"');
        }
        if (!/rel=/i.test(updated)) {
          updated += ' rel="noopener noreferrer"';
        }
        return `<a ${updated}>`;
      }
    );

    return cleaned;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 2000);
  };

  const isContactPage = page.slug === 'contact-us' || page.id === 30;
  const isGalleryPage = page.slug === 'gallery' || page.id === 52;
  const isPrincipalPage = page.slug === 'message' || page.id === 1374 || page.title.toLowerCase().includes('principal');
  const isTabbedPage = !isContactPage && !isGalleryPage && !isPrincipalPage && (() => {
    if (!page.content.includes('\t\t\t\t\t\t\t\t\t')) return false;
    const parts = page.content.split('\t\t\t\t\t\t\t\t\t');
    if (parts.length < 3) return false;
    const firstRawHeader = parts[1] || '';
    const firstCleanHeader = firstRawHeader.replace(/\r?\n/g, '').replace(/<[^>]+>/g, '').trim();
    if (!firstCleanHeader) return false;
    for (let i = 2; i < parts.length; i++) {
      const cleanPart = parts[i].replace(/\r?\n/g, '').replace(/<[^>]+>/g, '').trim();
      if (cleanPart.startsWith(firstCleanHeader)) {
        return true;
      }
    }
    return false;
  })();
  const notifications = data.home_fields.notification || [];

  // Parse tabbed page content dynamically
  let tabHeaders: string[] = [];
  let tabContents: Record<string, string> = {};
  let introHtml = '';

  if (isTabbedPage) {
    const parts = page.content.split('\t\t\t\t\t\t\t\t\t');
    introHtml = parts[0] || '';

    // Extract the first header to detect when the content block boundary starts
    const firstRawHeader = parts[1] || '';
    const firstCleanHeader = firstRawHeader.replace(/\r?\n/g, '').replace(/<[^>]+>/g, '').trim();

    let N = 0;
    for (let i = 2; i < parts.length; i++) {
      const cleanPart = parts[i].replace(/\r?\n/g, '').replace(/<[^>]+>/g, '').trim();
      if (cleanPart.startsWith(firstCleanHeader)) {
        N = i - 1;
        break;
      }
    }

    // Fallback if boundary detection fails
    if (N === 0) {
      N = Math.floor((parts.length - 1) / 2);
    }

    for (let i = 1; i <= N; i++) {
      const rawHeader = parts[i] || '';
      const cleanHeader = rawHeader.replace(/\r?\n/g, '').replace(/<[^>]+>/g, '').trim();

      if (cleanHeader) {
        tabHeaders.push(cleanHeader);

        // Corresponding content block is at N + i. For the last tab, gather all remaining parts.
        let body = '';
        if (i === N) {
          body = parts.slice(N + i).join('\t\t\t\t\t\t\t\t\t');
        } else {
          body = parts[N + i] || '';
        }

        const newlineIdx = body.indexOf('\n');
        const strippedBody = newlineIdx !== -1
          ? body.substring(newlineIdx).replace(/^\s*\t\t\t\t\t/, '').trim()
          : body.trim();

        tabContents[cleanHeader] = strippedBody;
      }
    }
  }

  // Set default active tab and reset when route changes
  useEffect(() => {
    if (isTabbedPage && tabHeaders.length > 0) {
      setActiveTab(tabHeaders[0]);
    } else {
      setActiveTab('');
    }
  }, [page.id, page.slug, isTabbedPage]);

  // Dedicated static gallery images loading
  const staticGalleryImages = isGalleryPage ? extractGalleryImages(page.content) : [];

  // Choose images list to show in lightbox (static gallery vs dynamic click intercept)
  const currentLightboxList = isGalleryPage ? staticGalleryImages : lightboxImages;

  // Handle Lightbox Keyboard Navigation Actions
  useEffect(() => {
    if (lightboxIndex === null || currentLightboxList.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev + 1) % currentLightboxList.length : null
        );
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev - 1 + currentLightboxList.length) % currentLightboxList.length : null
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, currentLightboxList.length]);

  // Intercept image clicks globally inside HTML rendering to spawn lightbox modals dynamically
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');

    if (anchor) {
      const href = anchor.getAttribute('href');
      // Detect image and video links (excluding PDFs)
      if (href && href.match(/\.(jpeg|jpg|png|gif|webp|mp4|webm|ogg)$/i)) {
        e.preventDefault();

        // Find all image/video anchors inside this container to build the lightbox list dynamically
        const container = e.currentTarget;
        const allAnchors = Array.from(container.querySelectorAll('a')).filter(a => {
          const h = a.getAttribute('href');
          return h && h.match(/\.(jpeg|jpg|png|gif|webp|mp4|webm|ogg)$/i);
        });

        const imagesList = allAnchors.map(a => {
          const fullUrl = (a.getAttribute('href') || '')
            .replace('https://drrzwc.in', '')
            .replace('http://localhost/drrzwc.in', '');
          const isVideo = !!fullUrl.match(/\.(mp4|webm|ogg)$/i);
          const img = a.querySelector('img, video');
          const thumbnailUrl = fullUrl; // Use original image for thumbnail
          const title = img
            ? img.getAttribute('alt') || img.getAttribute('title') || (isVideo ? 'Gallery Video' : 'Gallery Photo')
            : (isVideo ? 'Gallery Video' : 'Gallery Photo');

          return { fullUrl, thumbnailUrl, title, isVideo };
        });

        const clickedIdx = allAnchors.indexOf(anchor);
        setLightboxImages(imagesList);
        setLightboxIndex(clickedIdx !== -1 ? clickedIdx : 0);
      } else if (href && href.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i)) {
        // Office Document (.docx, .doc, .xlsx) -> Open via Google Docs Viewer to display document on screen without downloading
        e.preventDefault();
        const fullUrl = href.startsWith('http')
          ? href
          : `https://drrzwc.in${href.startsWith('/') ? '' : '/'}${href}`;
        const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}`;
        window.open(googleViewerUrl, '_blank', 'noopener,noreferrer');
      } else if (href && (href.match(/\.(pdf|csv|txt)$/i) || href.includes('/wp-content/uploads/'))) {
        // PDF / Text file -> Browser renders directly in tab
        anchor.removeAttribute('download');
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');
      }
    }
  };

  return (
    <div className="w-full flex flex-col font-sans">
      {/* Hero Page Banner */}
      <div
        className="w-full banner-image py-16 px-4 md:px-12 text-white relative flex items-center min-h-[180px]"
        style={{
          background: 'linear-gradient(to right, rgba(10, 29, 55, 0.9), rgba(15, 43, 70, 0.75)), url(/wp-content/uploads/2022/08/Web-03.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className=" mx-auto w-full px-4">
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-wider drop-shadow-md text-white font-heading uppercase">
            {page.title}
          </h1>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="w-full bg-[#faf9f6] py-14 px-4">
        <div className="mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Column: Page Content */}
            <div className={isGalleryPage ? "lg:col-span-12" : "lg:col-span-10"}>
              <div className="bg-white p-6 md:p-10 rounded-xl shadow-lg border border-zinc-200/80 min-h-[400px]">

                {isContactPage ? (
                  /* Custom Contact Us Layout */
                  <div className="flex flex-col space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left: Contact Info */}
                      <div className="flex flex-col space-y-4">
                        <h3 className="text-xl font-bold text-[#0a1d37] border-b pb-2 font-heading">
                          Dr. Rafiq Zakaria College for Women
                        </h3>
                        <div className="text-sm text-zinc-600 space-y-4 pt-2">
                          <p className="flex items-start">
                            <span className="text-[#c5a059] mr-3 font-semibold mt-0.5"><i className="fa fa-map-marker text-lg"></i></span>
                            <span><strong>Address:</strong> Jubilee Park, Navkhanda, <br />Aurangabad, Maharashtra 431001</span>
                          </p>
                          <p className="flex items-center">
                            <span className="text-[#c5a059] mr-3 font-semibold"><i className="fa fa-phone text-lg"></i></span>
                            <span><strong>Phone No. / Fax:</strong> 0240-2402462</span>
                          </p>
                          <p className="flex items-center">
                            <span className="text-[#c5a059] mr-3 font-semibold"><i className="fa fa-envelope text-lg"></i></span>
                            <span><strong>Email Id:</strong> principal@drrzwc.in</span>
                          </p>
                          <p className="flex items-center">
                            <span className="text-[#c5a059] mr-3 font-semibold"><i className="fa fa-globe text-lg"></i></span>
                            <span><strong>Website:</strong> www.drrzwc.in</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Contact Form */}
                      <div className="flex flex-col space-y-4">
                        <h3 className="text-xl font-bold text-[#0a1d37] border-b pb-2 font-heading">
                          Drop your message
                        </h3>
                        {formSubmitted ? (
                          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm font-medium animate-pulse font-heading">
                            Thank you! Your message has been sent successfully.
                          </div>
                        ) : (
                          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
                            <div>
                              <input
                                type="text"
                                placeholder="Your Name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059] focus:border-[#c5a059] transition-all"
                              />
                            </div>
                            <div>
                              <input
                                type="email"
                                placeholder="Your Email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059] focus:border-[#c5a059] transition-all"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                placeholder="Subject"
                                required
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059] focus:border-[#c5a059] transition-all"
                              />
                            </div>
                            <div>
                              <textarea
                                placeholder="Message"
                                rows={4}
                                required
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#c5a059] focus:border-[#c5a059] transition-all"
                              />
                            </div>
                            <button
                              type="submit"
                              className="px-6 py-2 bg-[#0a1d37] hover:bg-[#0f2b46] text-[#c5a059] border border-[#c5a059]/30 hover:border-[#c5a059] font-bold tracking-widest font-heading transition-all duration-200 text-xs uppercase rounded-md cursor-pointer"
                            >
                              Send Message
                            </button>
                          </form>
                        )}
                      </div>
                    </div>

                    {/* Google Map */}
                    <div className="w-full overflow-hidden rounded-md border border-zinc-200 shadow-sm mt-4">
                      <iframe
                        src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15007.439098291039!2d75.3195717!3d19.8881422!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0xb4803edb5d4da935!2sDr%20Rafiq%20Zakaria%20Womens%20College!5e0!3m2!1sen!2sin!4v1659634731738!5m2!1sen!2sin"
                        width="100%"
                        height="380"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                    </div>
                  </div>
                ) : isGalleryPage ? (
                  /* Redesigned Gallery Grid Portfolio */
                  <div className="flex flex-col space-y-6">
                    <p className="text-zinc-500 text-sm leading-relaxed mb-4">
                      Browse through photographs of our college campus, departments, functions, and academic events. Click on any image to view it in full size.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {staticGalleryImages.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setLightboxIndex(idx)}
                          className="group relative cursor-pointer overflow-hidden rounded-lg border border-zinc-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(197,160,89,0.15)] hover:border-[#c5a059]/40 transition-all duration-300 transform hover:-translate-y-1 bg-zinc-50"
                        >
                          <div className="aspect-[4/3] w-full overflow-hidden relative bg-zinc-100">
                            <img
                              src={img.thumbnailUrl}
                              alt={img.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.src = `https://drrzwc.in${img.thumbnailUrl}`;
                              }}
                            />
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-[#0a1d37]/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <span className="bg-white/95 text-[#0a1d37] px-4 py-2.5 rounded-full text-[10px] font-bold font-heading tracking-widest shadow-md transition-all duration-300 transform translate-y-3 group-hover:translate-y-0 uppercase">
                                View Image
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : isPrincipalPage ? (
                  /* Redesigned Principal's Message Layout */
                  <div className="flex flex-col space-y-8 font-sans">
                    {/* Header Title & Subtitle */}
                    <div className="border-b border-zinc-200 pb-4 flex items-center justify-between">
                      <div>
                        <span className="text-[#c5a059] font-heading font-bold text-xs uppercase tracking-widest">Leadership & Guidance</span>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-[#0a1d37] font-heading mt-1">Message from the Principal</h2>
                      </div>
                      <div className="hidden sm:block text-[#c5a059]/20 text-4xl">
                        <i className="fa fa-quote-right"></i>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Left Side: Photo & Profile Card (4 cols) */}
                      <div className="lg:col-span-4 flex flex-col items-center">
                        <div className="w-full bg-[#faf9f6] p-4 rounded-xl border border-zinc-200 shadow-md flex flex-col items-center text-center">
                          {/* Photo Container with Gold Accent */}
                          <div className="relative w-full aspect-[4/3] sm:aspect-square md:aspect-[3/4] overflow-hidden rounded-lg border-2 border-[#c5a059]/40 shadow-sm bg-zinc-100 group">
                            <img
                              src="/wp-content/uploads/2022/08/Pics_Sir-13-1024x683.jpg"
                              alt="Dr. Maqdoom Farooqui - Principal"
                              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.src = "https://drrzwc.in/wp-content/uploads/2022/08/Pics_Sir-13-1024x683.jpg";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1d37]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>

                          {/* Principal Details */}
                          <div className="mt-4 flex flex-col items-center w-full">
                            <h3 className="text-xl font-extrabold text-[#0a1d37] font-heading">
                              Dr. Maqdoom Farooqui
                            </h3>
                            <p className="text-[#c5a059] text-xs font-bold font-heading uppercase tracking-wider mt-1">
                              Principal
                            </p>
                            <div className="w-12 h-0.5 bg-[#c5a059] my-3 rounded-full"></div>
                            <p className="text-zinc-600 text-xs font-medium leading-relaxed">
                              Dr. Rafiq Zakaria College for Women
                            </p>
                            <p className="text-zinc-400 text-[11px] font-semibold mt-0.5 uppercase tracking-wide">
                              Aurangabad
                            </p>
                          </div>
                        </div>

                        {/* Quick Contact Card */}
                        <div className="w-full bg-[#0a1d37] text-white p-4 rounded-xl mt-4 shadow-md flex flex-col space-y-2 text-xs">
                          <div className="flex items-center text-[#c5a059] font-bold font-heading uppercase tracking-wider text-[11px]">
                            <i className="fa fa-envelope mr-2"></i> Contact Desk
                          </div>
                          <p className="text-zinc-300 text-[11px]">
                            Email: <span className="text-white font-medium">principal@drrzwc.in</span>
                          </p>
                          <p className="text-zinc-300 text-[11px]">
                            Phone: <span className="text-white font-medium">0240-2402462</span>
                          </p>
                        </div>
                      </div>

                      {/* Right Side: Message Text Content (8 cols) */}
                      <div className="lg:col-span-8 flex flex-col space-y-5 text-zinc-700 text-sm leading-relaxed">
                        {/* Highlighted Quote Box */}
                        <div className="relative bg-gradient-to-r from-[#0a1d37]/5 via-[#c5a059]/10 to-transparent p-5 rounded-r-xl border-l-4 border-[#0a1d37]">
                          <i className="fa fa-quote-left text-[#c5a059] text-2xl mb-2 block"></i>
                          <p className="text-[#0a1d37] font-semibold text-base italic leading-relaxed">
                            "I express my proud sentiments of affection & gratitude to the efforts of our late founder, Dr. Rafiq Zakaria and Padmashree Madam Fatma Rafiq Zakaria who devoted their lives to the cause of providing affordable quality education."
                          </p>
                        </div>

                        <p>
                          Dr. Rafiq Zakaria established an independent college exclusively for girls in recognition of their equal participation in building a good and healthy society, nation and civilization. Dr. Zakaria’s mission of uplifting women through educational empowerment was result placed by women, the once most important being the custodian of culture and values.
                        </p>

                        <p>
                          The ceaseless efforts & zeal of providing education was resumed by Madam Fatma Zakaria after the sad demise of Dr. Rafiq Zakaria. The President of India Conferred the Padma Shri upon her in recognition of her yeoman services in the field of education.
                        </p>

                        <p>
                          The dreams and foresightedness of our late founders as today thousands of girls have carved a successful future in the capacity of successful professionals in various field like teaching, fashion designing, hospitality, banking, finance and politics etc. By promoting uplifting & educating women of the minority Muslim community, they have set a noble example of providing services to the society and to the nation.
                        </p>

                        <p>
                          I put on record the collective efforts of my staff, who ensured all-round development of students through their active participation in curricular, co-curricular and extracurricular activities besides their excellent performance in studies.
                        </p>

                        <p>
                          I am grateful to the present management Padma Bhushan Dr. Fareed Zakaria, Chairman Emeritus, Mr. Farhat Jamal President, Mrs Supriya Sule(M.P), Adv Suhail Nathani, Mr Aziz Mulla, Mr Imtiaz Ur-Rehman and all the stakeholders who are the part of this great mission of influencing the young lives and to make them good citizen of this great country.
                        </p>

                        <div className="bg-[#faf9f6] p-4 rounded-lg border-l-2 border-[#c5a059] text-zinc-800 text-xs italic font-medium">
                          May Almighty Allah bless the college and all those who are associated with the noble mission of our late founders in the task of teaching & ensuring the progress of students.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isTabbedPage ? (
                  /* Redesigned Premium Tabbed UI Layout */
                  <div className="flex flex-col space-y-6">
                    {/* Intro text/header if present */}
                    {introHtml && (
                      <div
                        className="leftside mb-2"
                        dangerouslySetInnerHTML={{ __html: cleanHtmlContent(introHtml) }}
                      />
                    )}

                    {/* Tabs Navigation Header */}
                    {tabHeaders.length > 0 && (
                      <div className="w-full border-b border-zinc-200">
                        <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none space-x-1 pb-px">
                          {tabHeaders.map((header) => {
                            const isActive = activeTab === header;
                            return (
                              <button
                                key={header}
                                onClick={() => setActiveTab(header)}
                                className={`px-5 py-3 text-xs md:text-[11px] font-extrabold font-heading uppercase tracking-widest transition-all duration-200 rounded-t-lg border-t-2 border-x ${isActive
                                  ? 'bg-[#0a1d37] text-[#c5a059] border-t-[#c5a059] border-x-zinc-200 shadow-sm'
                                  : 'bg-[#faf9f6]/60 text-zinc-500 border-t-transparent border-x-transparent hover:bg-zinc-100/50 hover:text-[#0a1d37]'
                                  }`}
                              >
                                {header}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Active Tab Content Area */}
                    {activeTab && tabContents[activeTab] && (
                      <div
                        key={activeTab} // Setting key forces component replacement and re-triggers fade-in animations on tab switch
                        onClick={handleContentClick}
                        className="leftside break-words pt-4 animate-[fadeIn_0.3s_ease-out]"
                        dangerouslySetInnerHTML={{ __html: cleanHtmlContent(tabContents[activeTab]) }}
                      />
                    )}
                  </div>
                ) : (
                  /* Standard Rich Text Page Content */
                  <div
                    onClick={handleContentClick}
                    className="leftside break-words"
                    dangerouslySetInnerHTML={{ __html: cleanHtmlContent(page.content) }}
                  />
                )}

              </div>
            </div>

            {/* Right Column: Sidebar (Omit for Gallery page to show full width) */}
            {!isGalleryPage && (
              <div className="lg:col-span-2 flex flex-col space-y-6">

                {/* Notifications Widget */}
                <div className="flex flex-col bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden">
                  <h2 className="noti font-semibold text-white bg-[#0a1d37] border-l-4 border-[#c5a059] px-4 py-2.5 text-xs uppercase tracking-wider font-heading">
                    Notification
                  </h2>
                  <div className="p-4 bg-[#faf9f6]/40 max-h-[300px] overflow-hidden">
                    <div className="flex flex-col space-y-3 animate-[marqueeVertical_20s_linear_infinite] hover:[animation-play-state:paused]">
                      {notifications.map((noti: any, index: number) => (
                        <div key={index} className="border-b border-zinc-200/60 pb-2.5 last:border-0">
                          <a
                            href={noti.url.replace('https://drrzwc.in', '').replace('http://localhost/drrzwc.in', '')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-zinc-700 hover:text-[#c5a059] leading-snug block transition-colors duration-150"
                          >
                            {noti.title}
                          </a>
                        </div>
                      ))}
                      {/* Repeat for seamless scroll */}
                      {notifications.map((noti: any, index: number) => (
                        <div key={`dup-${index}`} className="border-b border-zinc-200/60 pb-2.5 last:border-0 lg:hidden">
                          <a
                            href={noti.url.replace('https://drrzwc.in', '').replace('http://localhost/drrzwc.in', '')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-zinc-700 hover:text-[#c5a059] leading-snug block transition-colors duration-150"
                          >
                            {noti.title}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar Quick Links */}
                <div className="flex flex-col bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden">
                  <h2 className="noti font-semibold text-white bg-[#0a1d37] border-l-4 border-[#c5a059] px-4 py-2.5 text-xs uppercase tracking-wider font-heading">
                    Quick Links
                  </h2>
                  <div className="p-4">
                    <ul className="space-y-2 text-xs font-semibold text-zinc-700">
                      <li className="flex items-center py-1.5 border-b border-zinc-100 last:border-0">
                        <span className="text-[#c5a059] mr-2">»</span>
                        <Link href="/" className="hover:text-[#c5a059] transition-colors">Home</Link>
                      </li>
                      <li className="flex items-center py-1.5 border-b border-zinc-100 last:border-0">
                        <span className="text-[#c5a059] mr-2">»</span>
                        <Link href="/about-us" className="hover:text-[#c5a059] transition-colors">About Us</Link>
                      </li>
                      <li className="flex items-center py-1.5 border-b border-zinc-100 last:border-0">
                        <span className="text-[#c5a059] mr-2">»</span>
                        <Link href="/admission-forms" className="hover:text-[#c5a059] transition-colors">Admissions Form</Link>
                      </li>
                      <li className="flex items-center py-1.5 border-b border-zinc-100 last:border-0">
                        <span className="text-[#c5a059] mr-2">»</span>
                        <Link href="/gallery" className="hover:text-[#c5a059] transition-colors">Gallery</Link>
                      </li>
                      <li className="flex items-center py-1.5 border-b border-zinc-100 last:border-0">
                        <span className="text-[#c5a059] mr-2">»</span>
                        <Link href="/contact-us" className="hover:text-[#c5a059] transition-colors">Contact Us</Link>
                      </li>
                    </ul>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>

      {/* Dynamic Fullscreen Lightbox Modal */}
      {lightboxIndex !== null && currentLightboxList.length > 0 && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center select-none">

          {/* Close Button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-[#c5a059] hover:scale-110 p-2 transition-all cursor-pointer z-50 text-2xl"
            aria-label="Close Lightbox"
          >
            <i className="fa fa-times" aria-hidden="true"></i>
          </button>

          {/* Left Arrow Button */}
          <button
            onClick={() => setLightboxIndex((prev) => prev !== null ? (prev - 1 + currentLightboxList.length) % currentLightboxList.length : null)}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/60 hover:text-[#c5a059] hover:scale-110 p-3 transition-all cursor-pointer z-50 text-3xl"
            aria-label="Previous Image"
          >
            <i className="fa fa-chevron-left" aria-hidden="true"></i>
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={() => setLightboxIndex((prev) => prev !== null ? (prev + 1) % currentLightboxList.length : null)}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/60 hover:text-[#c5a059] hover:scale-110 p-3 transition-all cursor-pointer z-50 text-3xl"
            aria-label="Next Image"
          >
            <i className="fa fa-chevron-right" aria-hidden="true"></i>
          </button>

          {/* Image/Video Canvas Frame */}
          <div className="w-[90%] max-w-[1000px] max-h-[75vh] flex items-center justify-center relative animate-[zoomIn_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            {currentLightboxList[lightboxIndex].isVideo ? (
              <video
                src={currentLightboxList[lightboxIndex].fullUrl}
                controls
                autoPlay
                className="max-w-full max-h-[75vh] object-contain rounded-md shadow-2xl"
                onError={(e) => {
                  e.currentTarget.src = `https://drrzwc.in${currentLightboxList[lightboxIndex].fullUrl}`;
                }}
              />
            ) : (
              <img
                src={currentLightboxList[lightboxIndex].fullUrl}
                alt={currentLightboxList[lightboxIndex].title}
                className="max-w-full max-h-[75vh] object-contain rounded-md shadow-2xl transition-all duration-300"
                onError={(e) => {
                  e.currentTarget.src = `https://drrzwc.in${currentLightboxList[lightboxIndex].fullUrl}`;
                }}
              />
            )}
          </div>

          {/* Meta & Counter Indicators */}
          <div className="mt-6 text-center text-white space-y-1.5 z-50 max-w-[80%]">
            <p className="text-xs font-semibold text-zinc-400 font-sans tracking-wide">
              {lightboxIndex + 1} of {currentLightboxList.length}
            </p>
            {currentLightboxList[lightboxIndex].title && (
              <p className="text-sm md:text-base font-semibold text-white tracking-widest uppercase font-heading">
                {currentLightboxList[lightboxIndex].title}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
