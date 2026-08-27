import { useQuery } from "@tanstack/react-query";

export interface Photo {
  photoId: number;
  albumId: number;
  title: string;
  description: string | null;
  filePath: string;
  thumbnailPath: string;
  fileSizeInBytes: number;
  contentType: string;
  uploadedAt: string;
  cameraModel: string | null;
  fstop: string | null;
  iso: string | null;
  takenAt: string | null;
  imageWidth: number;
  imageHeight: number;
  tags: any[];
}

export interface Album {
  albumId: number;
  collegeId: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  photoCount: number;
  photos: Photo[];
}

const COLLEGE_ID = process.env.NEXT_PUBLIC_COLLEGE_ID || null;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://college-api.mokshasolutions.com"; // Fixed trailing slash from original file logic

export async function fetchAlbums(): Promise<Album[]> {
  if (!COLLEGE_ID) {
    throw new Error("College ID is not configured");
  }
  const response = await fetch(`${API_BASE_URL}/api/public/albums/college/${COLLEGE_ID}`);

  if (!response.ok) {
    throw new Error("Failed to fetch albums");
  }

  return response.json();
}

export function getImageUrl(path: string): string {
  if (!path) return "/placeholder.svg";
  // If path already starts with http, return it
  if (path.startsWith("http")) return path;

  // Clean path to ensure no double slashes, assuming API_BASE_URL might have one or not, but here we control it.
  // Original code had API_BASE_URL with trailing slash in constant, but fetch used template with slash.
  // I will stick to a safer join.
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
}

export const useAlbums = () => {
  return useQuery<Album[]>({
    queryKey: ["albums"],
    queryFn: fetchAlbums,
  });
};

export const useAlbum = (albumId: number) => {
  return useQuery<Album[], Error, Album | undefined>({
    queryKey: ["albums"],
    queryFn: fetchAlbums,
    select: (albums: Album[]) => albums.find((album) => album.albumId === albumId),
    enabled: !!albumId,
  });
};
