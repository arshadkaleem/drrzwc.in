'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import data from '@/data/extracted_data.json';
import { useAlbum, getImageUrl, Photo } from '@/hooks/useGallery';
import { usePdfGalleries, usePdfGallery, getPdfUrl } from '@/hooks/usePdf';
import { useTimetable } from '@/hooks/useTimeTable';

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

const PDF_GALLERY_MAPPING: Record<string, string> = {
  'projects': 'projects',
  'beyond-campus': 'beyond campus',
  'student-satisfaction-survey': 'student satisfaction survey',
  'student-centric-activities': 'student centric activities',
  'redressal': 'redressal',
  'women-cell': 'women cell',
  'learning-outcome': 'learning outcome',
  'advance-learners-and-slow-learners': 'advance learners and slow learners',
  'curriculum-enrichment': 'curriculum enrichment',
  'alumni-meet-report': 'alumni',
  'field-projects': 'field projects',
  'academic-flexibility': 'academic flexibility',
  'continuous-internal-evaluation': 'continuous internal evaluation',
  'academic-calendar': 'academic calendar',
  'feedback': 'feedback',
  'scholarship-goi': 'scholarship',
  'best-practices': 'best practices'
};

const ALBUM_MAPPING: Record<string, { id: number; title: string }> = {
  'sports': { id: 60, title: 'Sports' },
  'home-science': { id: 56, title: 'Home Science' },
  'physics': { id: 57, title: 'Physics' },
  'zoology': { id: 58, title: 'Zoology' },
  'mathematics': { id: 59, title: 'Maths' },
  'earn-and-learn': { id: 61, title: 'Earn and Learn' },
  'departmental-library': { id: 62, title: 'Departmental Library' }
};

function splitGalleryContent(html: string): { introHtml: string; hasGallery: boolean } {
  if (!html) return { introHtml: '', hasGallery: false };

  const styleIdx = html.indexOf('<style type="text/css">');
  if (styleIdx !== -1 && html.includes('#gallery', styleIdx)) {
    return { introHtml: html.substring(0, styleIdx).trim(), hasGallery: true };
  }

  const divIdx = html.search(/<div\s+(?:[^>]*\s+)?id=["']gallery-[-a-zA-Z0-9_]+/i);
  if (divIdx !== -1) {
    return { introHtml: html.substring(0, divIdx).trim(), hasGallery: true };
  }

  const dlIdx = html.indexOf("<dl class='gallery-item'");
  if (dlIdx !== -1) {
    return { introHtml: html.substring(0, dlIdx).trim(), hasGallery: true };
  }

  const dlDoubleIdx = html.indexOf('<dl class="gallery-item"');
  if (dlDoubleIdx !== -1) {
    return { introHtml: html.substring(0, dlDoubleIdx).trim(), hasGallery: true };
  }

  if (html.includes('gallery-item') || html.includes('id="gallery-')) {
    return { introHtml: html, hasGallery: true };
  }

  return { introHtml: html, hasGallery: false };
}

function cleanPdfPageContent(html: string): string {
  if (!html) return '';
  // Remove iframes pointing to PDFs
  let cleaned = html.replace(/<iframe[^>]+src=['"][^'"]+\.pdf['"][^>]*>([\s\S]*?)<\/iframe>/gi, '');
  // Remove any text saying "Powered By EmbedPress"
  cleaned = cleaned.replace(/Powered By EmbedPress/gi, '');
  // Remove the entire ul if it contains links to pdf, xlsx, xls, doc, docx or contains uploads directory, preventing matching across multiple uls
  cleaned = cleaned.replace(/<ul[^>]*>(?:(?!<ul)[\s\S])*?(?:\.pdf|\.xlsx|\.xls|\.docx|\.doc|wp-content\/uploads)[\s\S]*?<\/ul>/gi, '');
  // Remove single standalone anchor tags pointing to PDFs/Excel files
  cleaned = cleaned.replace(/<a[^>]+href=['"][^'"]*(?:\.pdf|\.xlsx|\.xls|\.docx|\.doc)[^'"]*['"][^>]*>([\s\S]*?)<\/a>/gi, '');
  // Remove YouTube links (rendered separately as cards)
  cleaned = cleaned.replace(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[^\s<"']*/gi, '');
  // Remove empty lists or wrappers that might have been left over
  cleaned = cleaned.replace(/<li[^>]*>\s*<\/li>/gi, '');
  cleaned = cleaned.replace(/<ul[^>]*>\s*<\/ul>/gi, '');
  // Remove empty paragraph tags (possibly containing empty strong or em tags)
  cleaned = cleaned.replace(/<p[^>]*>(?:\s|&nbsp;|<strong[^>]*>\s*<\/strong>|<em[^>]*>\s*<\/em>)*<\/p>/gi, '');
  // Remove trailing hr or extra spacing
  cleaned = cleaned.replace(/<hr\s*\/?>\s*$/gi, '');
  return cleaned.trim();
}

function extractYoutubeVideos(html: string): { url: string; videoId: string }[] {
  if (!html) return [];
  const normalized = html.replace(/&#038;/g, '&');
  const videos: { url: string; videoId: string }[] = [];
  const parts = normalized.split(/(?=https?:\/\/)/gi);

  for (const part of parts) {
    const match = part.match(/(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})[^\s<"']*)/i);
    if (match) {
      videos.push({
        url: match[1].trim(),
        videoId: match[2]
      });
    }
  }

  return videos;
}

const hasVisibleText = (html: string) => {
  if (!html) return false;
  const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, '').replace(/\s+/g, '').trim();
  if (text.toLowerCase() === 'alumnimeetreport') return false;
  return text.length > 0;
};

export default function InnerPage({ page }: InnerPageProps) {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxImages, setLightboxImages] = useState<GalleryImage[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');

  const albumConfig = ALBUM_MAPPING[page.slug];
  const albumId = albumConfig ? albumConfig.id : 0;
  const { data: albumData, isLoading: isAlbumLoading, error: albumError } = useAlbum(albumId);

  // Fetch PDF galleries if the page has PDF docs associated with it
  const { data: pdfGalleries } = usePdfGalleries();
  const matchedPdfGallery = pdfGalleries?.find(g => {
    const titleLower = g.title.toLowerCase().trim();
    if (titleLower === page.title.toLowerCase().trim()) return true;
    const mappedTitle = PDF_GALLERY_MAPPING[page.slug];
    if (mappedTitle && titleLower === mappedTitle) return true;
    return false;
  });
  const matchedGalleryId = matchedPdfGallery?.galleryId;

  // Fetch documents for the matched PDF gallery
  const { data: pdfGalleryData, isLoading: isPdfLoading } = usePdfGallery(matchedGalleryId || 0);
  const pdfDocuments = pdfGalleryData?.documents || [];

  // Extract YouTube videos if present on the page
  const youtubeVideos = extractYoutubeVideos(page.content);

  // Fetch timetables if on the time table page
  const isTimetablePage = page.slug === 'time-table-dr-rzcw';
  const { data: timetables, isLoading: isTimetableLoading } = useTimetable({ enabled: isTimetablePage });
  const timetableRecords = timetables || [];

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatPhotoTitle = (title: string | null) => {
    if (!title) return 'Gallery Photo';

    // Custom labels for Departmental Library
    const lower = title.toLowerCase();
    if (lower.includes('comp-dept-lib')) return 'Computer Science Department';
    if (lower.includes('botany-dept-lib')) return 'Botany Department';
    if (lower.includes('chem-dept-lib')) return 'Chemistry Department';
    if (lower.includes('zoology-dept-lib')) return 'Zoology Department';

    if (/\.(jpe?g|png|gif|webp|bmp)/i.test(title) || /^[a-f0-9-]{36}/i.test(title)) {
      return 'Gallery Photo';
    }
    return title;
  };

  const galleryPhotos: GalleryImage[] = albumData?.photos?.map((photo: Photo) => ({
    fullUrl: getImageUrl(photo.filePath),
    thumbnailUrl: getImageUrl(photo.thumbnailPath || photo.filePath),
    title: formatPhotoTitle(photo.title),
    isVideo: false
  })) || [];

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
  const isVendingMachinePage = page.slug === 'vending-machine' || page.id === 1549;
  const isTabbedPage = !isContactPage && !isGalleryPage && !isPrincipalPage && !isVendingMachinePage && (() => {
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
                              src="/wp-content/uploads/2022/08/Pics_Sir-13.jpg"
                              alt="Dr. Maqdoom Farooqui - Principal"
                              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.src = "https://drrzwc.in/wp-content/uploads/2022/08/Pics_Sir-13.jpg";
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
                ) : isVendingMachinePage ? (
                  /* Redesigned Premium Vending Machine Page Layout */
                  <div className="flex flex-col space-y-8 font-sans">
                    {/* Header Title & Subtitle */}
                    <div className="border-b border-zinc-200 pb-4 flex items-center justify-between">
                      <div>
                        <span className="text-[#c5a059] font-heading font-bold text-xs uppercase tracking-widest">Campus Facilities & Welfare</span>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-[#0a1d37] font-heading mt-1">Sanitary Napkin Vending & Disposal Facility</h2>
                      </div>
                      <div className="hidden sm:block text-[#c5a059]/20 text-4xl">
                        <i className="fa fa-heartbeat"></i>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Left Column: Info & Details (7 cols) */}
                      <div className="lg:col-span-7 flex flex-col space-y-6 text-zinc-700 text-sm leading-relaxed">
                        <p className="text-base font-medium text-zinc-800">
                          Promoting hygiene, health, and comfort for our students.
                        </p>
                        <p>
                          To support the physical well-being, hygiene, and convenience of our female students, Dr. Rafiq Zakaria College for Women has installed automatic sanitary napkin vending machines and eco-friendly incinerators on campus.
                        </p>
                        <p>
                          These facilities are strategically placed in the common room and ladies' washrooms, providing an accessible, private, and dignified solution for menstrual hygiene management.
                        </p>

                        <div className="bg-[#faf9f6] p-5 rounded-xl border border-zinc-200/80 border-l-4 border-l-[#c5a059] space-y-4 shadow-sm">
                          <h4 className="text-sm font-extrabold text-[#0a1d37] font-heading uppercase tracking-wider">
                            Key Features & Highlights
                          </h4>
                          <ul className="space-y-3 text-xs">
                            <li className="flex items-start">
                              <span className="text-[#c5a059] mr-2.5 font-bold">✓</span>
                              <span><strong>Eco-Friendly Incinerator:</strong> Advanced electric incinerators are installed for clean, safe, and hygienic waste disposal.</span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-[#c5a059] mr-2.5 font-bold">✓</span>
                              <span><strong>Convenient Locations:</strong> Safely and privately accessible in common areas and washrooms.</span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-[#c5a059] mr-2.5 font-bold">✓</span>
                              <span><strong>Subsidized Rates:</strong> Offered at a highly nominal cost to ensure affordability for all students.</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Right Column: Photo (5 cols) */}
                      <div className="lg:col-span-5 flex flex-col items-center">
                        <div className="w-full bg-[#faf9f6] p-4 rounded-xl border border-zinc-200 shadow-md flex flex-col items-center">
                          {/* Image Container with Gold Accent */}
                          <div className="relative w-full overflow-hidden rounded-lg border-2 border-[#c5a059]/40 shadow-sm bg-zinc-100 group">
                            <img
                              src="/wp-content/uploads/2024/01/WhatsApp-Image-2024-01-15-at-6.03.07-PM.jpeg"
                              alt="Sanitary Napkin Vending Machine Facility"
                              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-103"
                              onError={(e) => {
                                e.currentTarget.src = "https://drrzwc.in/wp-content/uploads/2024/01/WhatsApp-Image-2024-01-15-at-6.03.07-PM.jpeg";
                              }}
                            />
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-[#0a1d37]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                          <div className="mt-3 text-center">
                            <p className="text-zinc-600 text-xs font-semibold uppercase tracking-wider font-heading">
                              On-Campus Vending Unit
                            </p>
                          </div>
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
                    {activeTab && (
                      <div
                        key={activeTab} // Setting key forces component replacement and re-triggers fade-in animations on tab switch
                        className="leftside break-words pt-4 animate-[fadeIn_0.3s_ease-out]"
                      >
                        {albumConfig && (activeTab === 'Gallery' || activeTab === 'Photo Gallery') ? (
                          (() => {
                            const { introHtml: galleryIntroHtml } = splitGalleryContent(tabContents[activeTab] || '');
                            return (
                              <>
                                {galleryIntroHtml && (
                                  <div
                                    onClick={handleContentClick}
                                    dangerouslySetInnerHTML={{ __html: cleanHtmlContent(galleryIntroHtml) }}
                                  />
                                )}

                                {isAlbumLoading ? (
                                  /* Shimmer Loading State */
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
                                    {Array.from({ length: 8 }).map((_, idx) => (
                                      <div
                                        key={idx}
                                        className="aspect-[4/3] w-full bg-zinc-200 animate-pulse rounded-lg"
                                      />
                                    ))}
                                  </div>
                                ) : albumError ? (
                                  <div className="text-red-500 font-medium py-4 text-center">
                                    Failed to load photo gallery. Please try again later.
                                  </div>
                                ) : galleryPhotos.length === 0 ? (
                                  <div className="text-zinc-500 py-4 text-center">
                                    No photos available in the gallery.
                                  </div>
                                ) : (
                                  /* Dynamic Gallery Grid */
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
                                    {galleryPhotos.map((img, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => {
                                          setLightboxImages(galleryPhotos);
                                          setLightboxIndex(idx);
                                        }}
                                        className="group relative cursor-pointer overflow-hidden rounded-lg border border-zinc-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(197,160,89,0.15)] hover:border-[#c5a059]/40 transition-all duration-300 transform hover:-translate-y-1 bg-zinc-50"
                                      >
                                        <div className="aspect-[4/3] w-full overflow-hidden relative bg-zinc-100">
                                          <img
                                            src={img.thumbnailUrl}
                                            alt={img.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            onError={(e) => {
                                              e.currentTarget.src = img.fullUrl;
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
                                )}
                              </>
                            );
                          })()
                        ) : page.slug === 'about-iqac' && activeTab === 'About IQAC' ? (
                          <div className="flex flex-col space-y-8 mt-4">
                            {/* Coordinator Profile Header Card */}
                            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center">
                              {/* Coordinator Image */}
                              <div className="relative group flex-shrink-0">
                                <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#c5a059] to-[#0a1d37] rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                                <div className="relative w-40 h-44 rounded-lg overflow-hidden border-2 border-white shadow-md bg-zinc-50">
                                  <img
                                    src="https://drrzwc.in/wp-content/uploads/2023/02/DrTanmay.jpg"
                                    alt="Dr. Tanmay Arvind Paithankar"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                </div>
                              </div>

                              {/* Coordinator Info */}
                              <div className="flex-1 text-center md:text-left space-y-3">
                                <div>
                                  <span className="bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/20 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                                    IQAC Coordinator
                                  </span>
                                </div>
                                <h3 className="text-xl font-bold font-heading text-[#0a1d37]">
                                  Dr. Tanmay Arvind Paithankar
                                </h3>
                                <p className="text-sm font-semibold text-zinc-600 leading-snug">
                                  Professor & Head, Department of Political Science
                                </p>
                                <div className="text-xs text-zinc-400 font-medium leading-relaxed pt-2 border-t border-zinc-100 flex flex-col space-y-1">
                                  <p>Dr. Rafiq Zakaria College for Women</p>
                                  <p>Navkhanda, Jubilee Park, Aurangabad – 431001 (M.S.)</p>
                                </div>
                              </div>
                            </div>

                            {/* Info Cards Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Card 1: Mechanisms */}
                              <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 flex flex-col">
                                <div className="flex items-center space-x-3.5 mb-5 border-b border-zinc-100 pb-4">
                                  <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 !text-[#c5a059] flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                  </div>
                                  <h4 className="text-sm font-bold font-heading text-[#0a1d37] uppercase tracking-wider">
                                    Mechanisms & Procedures
                                  </h4>
                                </div>
                                <ul className="space-y-3.5 text-xs text-zinc-600 flex-1">
                                  {[
                                    'Ensuring timely, efficient and progressive performance of academic, administrative and financial tasks.',
                                    'The relevance and quality of academic and research programmes.',
                                    'Equitable access to and affordability of academic programmes for various sections of society.',
                                    'Optimization and integration of modern methods of teaching and learning.',
                                    'The credibility of evaluation procedures.',
                                    'Ensuring the adequacy, maintenance and functioning of the support structure and services.',
                                    'Research sharing and networking with other institutions in India and abroad.'
                                  ].map((item, idx) => (
                                    <li key={idx} className="flex items-start space-x-2.5 leading-relaxed">
                                      <span className="text-[#c5a059] mt-1 font-bold">➔</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Card 2: Functions */}
                              <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 flex flex-col">
                                <div className="flex items-center space-x-3.5 mb-5 border-b border-zinc-100 pb-4">
                                  <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 !text-[#c5a059] flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                  </div>
                                  <h4 className="text-sm font-bold font-heading text-[#0a1d37] uppercase tracking-wider">
                                    Functions of IQAC
                                  </h4>
                                </div>
                                <ul className="space-y-3.5 text-xs text-zinc-600 flex-1">
                                  {[
                                    'Development and application of quality benchmarks/parameters for academic & administrative activities.',
                                    'Facilitating a learner-centric environment and faculty maturation for participatory teaching.',
                                    'Arrangement for feedback response from students, parents, and stakeholders.',
                                    'Dissemination of information on quality parameters of higher education.',
                                    'Organization of workshops and seminars on quality-related themes.',
                                    'Documentation of various programmes leading to quality improvement.',
                                    'Acting as a nodal agency for coordinating quality-related activities and best practices.',
                                    'Development of institutional database through MIS to maintain quality.',
                                    'Development of Quality Culture in the institution.',
                                    'Preparation of the Annual Quality Assurance Report (AQAR) for NAAC.'
                                  ].map((item, idx) => (
                                    <li key={idx} className="flex items-start space-x-2.5 leading-relaxed">
                                      <span className="text-[#c5a059] mt-1 font-bold">➔</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Card 3: Benefits */}
                              <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 flex flex-col">
                                <div className="flex items-center space-x-3.5 mb-5 border-b border-zinc-100 pb-4">
                                  <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 !text-[#c5a059] flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                  </div>
                                  <h4 className="text-sm font-bold font-heading text-[#0a1d37] uppercase tracking-wider">
                                    Benefits & Outcomes
                                  </h4>
                                </div>
                                <ul className="space-y-3.5 text-xs text-zinc-600 flex-1">
                                  {[
                                    'Ensure heightened level of clarity and focus in institutional functioning towards quality enhancement.',
                                    'Ensure internalization of the quality culture.',
                                    'Ensure coordination among various activities and institutionalize all good practices.',
                                    'Provide a sound basis for decision-making to improve institutional functioning.',
                                    'Act as a dynamic system for quality changes in HEIs.',
                                    'Build an organized methodology of documentation and internal communication.'
                                  ].map((item, idx) => (
                                    <li key={idx} className="flex items-start space-x-2.5 leading-relaxed">
                                      <span className="text-[#c5a059] mt-1 font-bold">➔</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Diagrams Section */}
                            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 md:p-8">
                              <div className="flex flex-col md:flex-row gap-8 justify-start items-start">
                                <div className="group relative overflow-hidden max-w-lg transition-all duration-300">
                                  <img
                                    src="https://drrzwc.in/wp-content/uploads/2023/02/AboutIQACFirst.jpg"
                                    alt="IQAC Quality Process Flowchart"
                                    className="w-full h-auto max-h-[300px] object-contain transition-transform duration-500 group-hover:scale-103"
                                  />
                                </div>
                                <div className="group relative overflow-hidden max-w-xs transition-all duration-300">
                                  <img
                                    src="https://drrzwc.in/wp-content/uploads/2023/02/AboutIQACSecond-269x300.jpg"
                                    alt="IQAC Hierarchy Chart"
                                    className="w-full h-auto max-h-[300px] object-contain transition-transform duration-500 group-hover:scale-103"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : page.slug === 'about-iqac' && activeTab === 'Docs' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 w-full">
                            {[
                              {
                                year: 'IQAC 2019-20',
                                docs: [
                                  {
                                    title: 'Significant Contributions 2019-20',
                                    url: '/wp-content/uploads/2023/01/12-Significant-Contributions-2019-20.pdf'
                                  },
                                  {
                                    title: 'Plan of action chalked 2019-20',
                                    url: '/wp-content/uploads/2023/01/13.-Plan-of-action-chalked-2019-20.pdf'
                                  }
                                ]
                              }
                            ].map((card, cardIdx) => (
                              <div key={cardIdx} className="bg-white rounded-xl border border-zinc-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col justify-between">
                                <div>
                                  {/* Card Header */}
                                  <div className="bg-[#0a1d37] px-5 py-4 border-b border-zinc-200/20 flex items-center justify-between">
                                    <h3 className="text-sm font-bold font-heading !text-[#c5a059] uppercase tracking-wider">
                                      {card.year}
                                    </h3>
                                    <span className="bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                      Documents
                                    </span>
                                  </div>

                                  {/* Card Body */}
                                  <div className="p-3 divide-y divide-zinc-100">
                                    {card.docs.map((doc, idx) => (
                                      <a
                                        key={idx}
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 transition-all duration-200 group"
                                      >
                                        <div className="flex items-center space-x-3">
                                          {/* PDF Icon */}
                                          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors flex-shrink-0">
                                            <svg
                                              width="18"
                                              height="18"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                              strokeWidth="2"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                              />
                                            </svg>
                                          </div>
                                          <div>
                                            <p className="text-xs font-semibold text-zinc-700 group-hover:text-[#c5a059] transition-colors leading-snug">
                                              {doc.title}
                                            </p>
                                            <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mt-0.5">
                                              PDF Document
                                            </p>
                                          </div>
                                        </div>
                                        {/* Action Icon */}
                                        <div className="w-7 h-7 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 group-hover:border-[#c5a059] group-hover:text-[#c5a059] transition-all flex-shrink-0 ml-2">
                                          <i className="fa fa-chevron-right text-[10px]" aria-hidden="true"></i>
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : tabContents[activeTab] ? (
                          <div
                            onClick={handleContentClick}
                            dangerouslySetInnerHTML={{ __html: cleanHtmlContent(tabContents[activeTab]) }}
                          />
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard Rich Text Page Content */
                  albumConfig ? (
                    (() => {
                      const pageIntroHtml = page.slug === 'departmental-library' ? '' : splitGalleryContent(page.content || '').introHtml;
                      return (
                        <div className="flex flex-col">
                          {pageIntroHtml && (
                            <div
                              onClick={handleContentClick}
                              className="leftside break-words"
                              dangerouslySetInnerHTML={{ __html: cleanHtmlContent(pageIntroHtml) }}
                            />
                          )}

                          {isAlbumLoading ? (
                            /* Shimmer Loading State */
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
                              {Array.from({ length: 8 }).map((_, idx) => (
                                <div
                                  key={idx}
                                  className="aspect-[4/3] w-full bg-zinc-200 animate-pulse rounded-lg"
                                />
                              ))}
                            </div>
                          ) : albumError ? (
                            <div className="text-red-500 font-medium py-4 text-center">
                              Failed to load gallery. Please try again later.
                            </div>
                          ) : galleryPhotos.length === 0 ? (
                            <div className="text-zinc-500 py-4 text-center">
                              No photos available in the gallery.
                            </div>
                          ) : (
                            /* Dynamic Gallery Grid */
                            <div className={
                              page.slug === 'departmental-library'
                                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6"
                                : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6"
                            }>
                              {galleryPhotos.map((img, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    setLightboxImages(galleryPhotos);
                                    setLightboxIndex(idx);
                                  }}
                                  className={
                                    page.slug === 'departmental-library'
                                      ? "group cursor-pointer overflow-hidden rounded-xl border border-zinc-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-lg hover:border-[#c5a059]/40 transition-all duration-300 transform hover:-translate-y-1 bg-white p-3 flex flex-col justify-between"
                                      : "group relative cursor-pointer overflow-hidden rounded-lg border border-zinc-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(197,160,89,0.15)] hover:border-[#c5a059]/40 transition-all duration-300 transform hover:-translate-y-1 bg-zinc-50"
                                  }
                                >
                                  <div className={
                                    page.slug === 'departmental-library'
                                      ? "aspect-[4/3] w-full overflow-hidden relative rounded-lg bg-zinc-100"
                                      : "aspect-[4/3] w-full overflow-hidden relative bg-zinc-100"
                                  }>
                                    <img
                                      src={img.thumbnailUrl}
                                      alt={img.title}
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                      onError={(e) => {
                                        e.currentTarget.src = img.fullUrl;
                                      }}
                                    />
                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-[#0a1d37]/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                      <span className="bg-white/95 text-[#0a1d37] px-4 py-2.5 rounded-full text-[10px] font-bold font-heading tracking-widest shadow-md transition-all duration-300 transform translate-y-3 group-hover:translate-y-0 uppercase">
                                        View Image
                                      </span>
                                    </div>
                                  </div>
                                  {page.slug === 'departmental-library' && (
                                    <div className="mt-3 px-1">
                                      <h4 className="text-sm font-bold text-[#0a1d37] group-hover:text-[#c5a059] transition-colors leading-snug">
                                        {img.title}
                                      </h4>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : isTimetablePage ? (
                    <div className="flex flex-col space-y-6">
                      {/* Premium Timetable Documents Section */}
                      <div className="mt-4">
                        <h3 className="text-lg font-bold font-heading text-[#0a1d37] border-b-2 border-[#c5a059] pb-2 mb-6 inline-block">
                          College Timetables
                        </h3>

                        {isTimetableLoading ? (
                          /* Shimmer Loading State */
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 3 }).map((_, idx) => (
                              <div
                                key={idx}
                                className="h-44 bg-zinc-150 animate-pulse rounded-xl border border-zinc-200"
                              />
                            ))}
                          </div>
                        ) : timetableRecords.length === 0 ? (
                          <div className="text-zinc-500 py-6 text-center bg-zinc-50 rounded-xl border border-zinc-150">
                            No timetables available.
                          </div>
                        ) : (
                          /* Premium Timetable Grid */
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {timetableRecords.map((record) => (
                              <div
                                key={record.timetableId}
                                className="bg-white rounded-xl border border-zinc-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-[#c5a059]/40 transition-all duration-300 p-5 flex flex-col justify-between group"
                              >
                                <div className="space-y-4">
                                  {/* Header Info */}
                                  <div className="flex items-start space-x-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
                                      <svg
                                        width="20"
                                        height="20"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        strokeWidth="2.2"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                    </div>
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-bold text-zinc-700 leading-snug group-hover:text-[#c5a059] transition-colors line-clamp-2">
                                        {record.title}
                                      </h4>
                                      <div className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase flex flex-wrap gap-x-2 gap-y-0.5">
                                        {record.academicYear && <span>{record.academicYear}</span>}
                                        {record.academicYear && (record.department || record.semester) && <span>•</span>}
                                        {record.department && <span>{record.department}</span>}
                                        {record.department && record.semester && <span>•</span>}
                                        {record.semester && <span>Semester {record.semester}</span>}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <a
                                  href={getPdfUrl(record.filePath)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full mt-5 bg-[#0a1d37] hover:bg-[#c5a059] text-white py-2.5 rounded-lg text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-200 flex items-center justify-center space-x-2 shadow-sm"
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2.5"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                  <span>View Timetable</span>
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (page.slug in PDF_GALLERY_MAPPING) ? (
                    <div className="flex flex-col space-y-6">
                      {/* Render text/HTML content of the page if it has visible text after cleaning */}
                      {hasVisibleText(cleanPdfPageContent(page.content)) && (
                        <div
                          onClick={handleContentClick}
                          className="leftside break-words border-b border-zinc-200 pb-6 mb-4"
                          dangerouslySetInnerHTML={{ __html: cleanHtmlContent(cleanPdfPageContent(page.content)) }}
                        />
                      )}

                      {/* Premium PDF Documents Section */}
                      <div className="mt-4">
                        <h3 className="text-lg font-bold font-heading text-[#0a1d37] border-b-2 border-[#c5a059] pb-2 mb-6 inline-block">
                          Official Documents & Reports
                        </h3>

                        {isPdfLoading ? (
                          /* Shimmer Loading State */
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 3 }).map((_, idx) => (
                              <div
                                key={idx}
                                className="h-44 bg-zinc-150 animate-pulse rounded-xl border border-zinc-200"
                              />
                            ))}
                          </div>
                        ) : pdfDocuments.length === 0 ? (
                          <div className="text-zinc-500 py-6 text-center bg-zinc-50 rounded-xl border border-zinc-150">
                            No documents available.
                          </div>
                        ) : (
                          /* Premium Document Grid */
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pdfDocuments.map((doc) => (
                              <div
                                key={doc.documentId}
                                className="bg-white rounded-xl border border-zinc-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-[#c5a059]/40 transition-all duration-300 p-5 flex flex-col justify-between group"
                              >
                                <div className="space-y-4">
                                  {/* Header Info */}
                                  <div className="flex items-start space-x-4">
                                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                                      <svg
                                        width="20"
                                        height="20"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        strokeWidth="2.2"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                    </div>
                                    <div className="space-y-1">
                                      <h4 className="text-lg font-bold text-zinc-700 leading-snug group-hover:text-[#c5a059] transition-colors line-clamp-2">
                                        {doc.title}
                                      </h4>
                                      <div className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase">
                                        PDF Document
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <a
                                  href={getPdfUrl(doc.filePath)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full mt-5 bg-[#0a1d37] hover:bg-[#c5a059] text-white py-2.5 rounded-lg text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-200 flex items-center justify-center space-x-2 shadow-sm"
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2.5"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                  <span>View Document</span>
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Premium YouTube Videos Section */}
                      {youtubeVideos.length > 0 && (
                        <div className="mt-8 border-t border-zinc-150 pt-8">
                          <h3 className="text-lg font-bold font-heading text-[#0a1d37] border-b-2 border-[#c5a059] pb-2 mb-6 inline-block">
                            Video Resources & Presentations
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {youtubeVideos.map((video, idx) => (
                              <div key={idx} className="bg-white border border-zinc-200 p-5 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:shadow-md hover:border-[#c5a059]/40 transition-all duration-300">
                                <div className="w-full aspect-video rounded-lg overflow-hidden border border-zinc-200 bg-black relative">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${video.videoId}`}
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={`YouTube Video ${idx + 1}`}
                                  ></iframe>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                                    Video Presentation {idx + 1}
                                  </span>
                                  <a
                                    href={video.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#0a1d37] hover:text-[#c5a059] transition-colors font-heading"
                                  >
                                    <i className="fa fa-youtube-play text-red-600 text-sm"></i>
                                    <span>Watch on YouTube</span>
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={handleContentClick}
                      className="leftside break-words"
                      dangerouslySetInnerHTML={{ __html: cleanHtmlContent(page.content) }}
                    />
                  )
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
