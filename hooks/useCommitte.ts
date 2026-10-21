import { useQuery } from "@tanstack/react-query";

const COLLEGE_ID = process.env.NEXT_PUBLIC_COLLEGE_ID || null;
const API_BASE_URL = "https://college-api.mokshasolutions.com";

export interface CommitteeMember {
    memberId: number;
    committeeId: number;
    name: string;
    designation: string;
    orderBy: number;
    isActive: boolean;
}

export interface Committee {
    committeeId: number;
    collegeId: string;
    name: string;
    description: string | null;
    collegeType: string;
    orderBy: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    members: CommitteeMember[];
}

export const useCommittees = () => {
    return useQuery<Committee[]>({
        queryKey: ["committees", COLLEGE_ID],

        // 🔒 Prevents API call when ID is missing
        enabled: Boolean(COLLEGE_ID),

        queryFn: async () => {
            if (!COLLEGE_ID) {
                throw new Error("College ID is not configured");
            }

            const res = await fetch(
                `${API_BASE_URL}/api/PublicCommittees/college/${COLLEGE_ID}`
            );

            if (!res.ok) {
                throw new Error("Failed to fetch committee data");
            }

            return res.json();
        },
    });
};
