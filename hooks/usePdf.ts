import { useQuery } from "@tanstack/react-query";

export interface PdfDocument {
  documentId: number;
  galleryId: number;
  collegeId: string;
  galleryTitle: string;
  title: string;
  description: string | null;
  filePath: string;
  originalFileName: string;
  fileSizeInBytes: number;
  orderBy: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PdfGallery {
  galleryId: number;
  collegeId: string;
  categoryId: number | null;
  categoryName: string | null;
  title: string;
  description: string | null;
  isPublic: boolean;
  orderBy: number;
  isActive: boolean;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
  documents?: PdfDocument[];
}

const COLLEGE_ID = process.env.NEXT_PUBLIC_COLLEGE_ID || null;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://college-api.mokshasolutions.com";

export async function fetchPdfGalleries(): Promise<PdfGallery[]> {
  if (!COLLEGE_ID) {
    throw new Error("College ID is not configured");
  }
  const response = await fetch(`${API_BASE_URL}/api/public/pdf/college/${COLLEGE_ID}`);

  if (!response.ok) {
    throw new Error("Failed to fetch PDF galleries");
  }

  return response.json();
}

export async function fetchPdfGallery(galleryId: number): Promise<PdfGallery> {
  const response = await fetch(`${API_BASE_URL}/api/public/pdf/gallery/${galleryId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch PDF gallery with ID ${galleryId}`);
  }

  return response.json();
}

export function getPdfUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
}

export const usePdfGalleries = () => {
  return useQuery<PdfGallery[]>({
    queryKey: ["pdfGalleries"],
    queryFn: fetchPdfGalleries,
  });
};

export const usePdfGallery = (galleryId: number) => {
  return useQuery<PdfGallery>({
    queryKey: ["pdfGallery", galleryId],
    queryFn: () => fetchPdfGallery(galleryId),
    enabled: !!galleryId,
  });
};
