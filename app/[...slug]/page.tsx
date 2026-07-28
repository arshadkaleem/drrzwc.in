import data from '@/data/extracted_data.json';
import InnerPage from '../components/InnerPage';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface CatchAllProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  // Return all unique page slugs for pre-rendering
  return data.pages
    .filter((p) => p.slug && p.slug !== 'home')
    .map((p) => ({
      slug: [p.slug],
    }));
}

export async function generateMetadata({ params }: CatchAllProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug || slug.length === 0) return {};

  const lastSegment = slug[slug.length - 1];
  const matchedPage = data.pages.find((p) => p.slug === lastSegment);

  if (matchedPage) {
    // Strip HTML tags for meta description
    const textDescription = matchedPage.content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 160);

    return {
      title: `${matchedPage.title} | Dr. Rafiq Zakaria College for Women`,
      description: textDescription || undefined,
    };
  }

  return {};
}

export default async function Page({ params }: CatchAllProps) {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    return notFound();
  }

  const lastSegment = slug[slug.length - 1];
  const matchedPage = data.pages.find((p) => p.slug === lastSegment);

  if (!matchedPage) {
    // Check if it's contact-us specifically, even if database page is not found or is a draft
    if (lastSegment === 'contact-us') {
      return (
        <InnerPage
          page={{
            id: 30,
            slug: 'contact-us',
            title: 'Contact Us',
            content: '',
          }}
        />
      );
    }
    return notFound();
  }

  return <InnerPage page={matchedPage} />;
}
