import { useQuery } from "@tanstack/react-query";

const COLLEGE_ID = process.env.NEXT_PUBLIC_COLLEGE_ID!;
const API_URL = `https://shivatrust-api.mokshasolutions.com/api/Mandates/college/${COLLEGE_ID}`;

export interface Mandate {
  mandateId: number;
  year: string;
  title: string;
  mandateType?: string;
  normBodyCode?: string;
  filePath: string;
  orderBy: number;
  isActive: boolean;
}

export const useMandates = () => {
  return useQuery<Mandate[]>({
    queryKey: ["muhs-mandates"],
    queryFn: async () => {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch mandates");
      return res.json();
    },
  });
};
