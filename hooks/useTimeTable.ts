import { useQuery } from "@tanstack/react-query";

const COLLEGE_ID = process.env.NEXT_PUBLIC_COLLEGE_ID!;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://college-api.mokshasolutions.com";
const API_URL = `${API_BASE_URL}/api/public/timetables/college/${COLLEGE_ID}`;

export interface Timetable {
  timetableId: number;
  collegeId: string;
  title: string;
  academicYear: string;
  department: string;
  semester: string;
  filePath: string;
  originalFileName: string;
  orderBy: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useTimetable = (options?: { enabled?: boolean }) => {
  return useQuery<Timetable[]>({
    queryKey: ["timetables"],
    queryFn: async () => {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch timetables");
      return res.json();
    },
    enabled: options?.enabled ?? true,
  });
};
