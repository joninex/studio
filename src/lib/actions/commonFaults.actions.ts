// src/lib/actions/commonFaults.actions.ts
"use server";

import type { CommonFault } from "@/types";
import { COMMON_FAULTS_DATA } from "@/lib/data/common-faults";

let mockCommonFaults: CommonFault[] = COMMON_FAULTS_DATA.map((fault, index) => ({
    id: `fault-${index + 1}`,
    ...fault
}));

export async function getCommonFaults(query?: string): Promise<CommonFault[]> {
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate tiny network delay

    if (!query) {
        return mockCommonFaults;
    }
    
    const lowerCaseQuery = query.toLowerCase();
    return mockCommonFaults.filter(fault => 
        fault.activator.toLowerCase().includes(lowerCaseQuery) ||
        fault.fullText.toLowerCase().includes(lowerCaseQuery) ||
        fault.keywords.some(k => k.toLowerCase().includes(lowerCaseQuery))
    );
}

// In a real application, you would implement the following functions
// to interact with a persistent database (e.g., Firestore).

export async function createCommonFault(data: Omit<CommonFault, 'id'>): Promise<CommonFault> {
    console.log("Creating common fault (mock):", data);
    const newFault = { id: `fault-${Date.now()}`, ...data };
    mockCommonFaults.push(newFault);
    return newFault;
}

export async function updateCommonFault(id: string, data: Partial<CommonFault>): Promise<CommonFault | null> {
    console.log(`Updating common fault ${id} (mock):`, data);
    const index = mockCommonFaults.findIndex(f => f.id === id);
    if (index !== -1) {
        mockCommonFaults[index] = { ...mockCommonFaults[index], ...data };
        return mockCommonFaults[index];
    }
    return null;
}

export async function deleteCommonFault(id: string): Promise<{ success: boolean }> {
    console.log(`Deleting common fault ${id} (mock)`);
    const index = mockCommonFaults.findIndex(f => f.id === id);
    if (index !== -1) {
        mockCommonFaults.splice(index, 1);
        return { success: true };
    }
    return { success: false };
}
