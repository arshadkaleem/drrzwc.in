import { useQuery } from "@tanstack/react-query";

// Explicit ID provided by user request
const COLLEGE_ID = process.env.NEXT_PUBLIC_COLLEGE_ID!;
const API_URL = `https://college-api.mokshasolutions.com/api/PublicStaff?id=${COLLEGE_ID}`;

export interface StaffMember {
    staffId: number;
    collegeId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    post: string; // Designation
    listOrder: number;
    staffType: string; // "Teaching" | "Non-Teaching" (Assumption, will verify)
    isActive: boolean;
    mobile: string;
    email: string;
    cv: string; // URL to CV/Image? User code mapped image to this? Or is it a document?
    // User's previous fake data had "image". The JSON has "cv". 
    // Usually "cv" is a document, but maybe there's an image field missing or I should use a placeholder?
    // I noticed "Staff Picture Upload" in conversation history, let's see if I can find where that went.
    // For now, I will stick to the provided JSON. I'll add an optional 'image' field just in case it comes through, or use specific logic.
    lastUpdated: string;
    staffImage: string;
    staffPicture?: string | null;
    department?: string | null;
    dob?: string | null;
    doj?: string | null;
    exp?: string | null;
}

export const useStaff = () => {
    return useQuery<StaffMember[]>({
        queryKey: ["staff", COLLEGE_ID], // Cache key including ID
        queryFn: async () => {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error("Failed to fetch staff data");
            return res.json();
        },
    });
};
