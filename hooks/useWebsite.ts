import { useQuery } from "@tanstack/react-query";

const COLLEGE_ID = process.env.NEXT_PUBLIC_COLLEGE_ID || "";
const API_BASE_URL = "https://shivatrust-api.mokshasolutions.com";

export interface Section {
  sectionId: number;
  name: string;
  slug: string;
  description: string | null;
  orderBy: number;
  isActive: boolean;
}

export interface ContentItem {
  contentItemId: number;
  sectionId: number;
  collegeId: string;
  title: string;
  contentBody: string | null;
  filePath: string | null;
  fileName: string | null;
  externalUrl?: string | null;
  orderBy: number;
  isActive: boolean;
  publishDate?: string | null;
}

// Helper to map API content items to the frontend ContentItem structure
const mapContentItem = (item: any): ContentItem => ({
  contentItemId: item.itemId,
  sectionId: item.sectionId,
  collegeId: item.collegeId,
  title: item.title,
  contentBody: item.contentBody,
  filePath: item.filePath,
  fileName: item.originalFileName,
  externalUrl: item.externalUrl || null,
  orderBy: item.orderBy,
  isActive: item.isActive,
  publishDate: item.itemDate || item.createdAt || null,
});

// 1. Hook to fetch all sections
export const useSections = () => {
  return useQuery<Section[]>({
    queryKey: ["website-sections", COLLEGE_ID],
    enabled: !!COLLEGE_ID,
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/public/content/sections`);
      if (!res.ok) {
        throw new Error("Failed to fetch website sections");
      }
      return res.json();
    },
  });
};

// 2. Hook to fetch content items by section ID
export const useContentItems = (sectionId: number) => {
  const { data: sections } = useSections();
  const section = sections?.find((s) => s.sectionId === sectionId);
  const slug = section?.slug;

  return useQuery<ContentItem[]>({
    queryKey: ["content-items", sectionId, COLLEGE_ID],
    enabled: !!sectionId && !!COLLEGE_ID && !!slug,
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/api/public/content/${COLLEGE_ID}/${slug}/items`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch content items for section ID ${sectionId}`);
      }
      const data = await res.json();
      return data.map(mapContentItem);
    },
  });
};

// 3. Hook to fetch content items by section slug
export const useContentItemsBySlug = (slug: string) => {
  return useQuery<ContentItem[]>({
    queryKey: ["content-items-slug", slug, COLLEGE_ID],
    enabled: !!slug && !!COLLEGE_ID,
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/api/public/content/${COLLEGE_ID}/${slug}/items`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch content items for section slug "${slug}"`);
      }
      const data = await res.json();
      return data.map(mapContentItem);
    },
  });
};
