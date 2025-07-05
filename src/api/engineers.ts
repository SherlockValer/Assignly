import axiosInstance from './axiosInstance';
import type { User } from '../context/AuthContext';

interface EngineerCapacity {
  currentCapacity: number;
  availableCapacity: number;
  assignments: Array<{
    _id: string;
    projectId: string;
    allocationPercentage: number;
    startDate: string;
    endDate: string;
  }>;
}

export async function getAllEngineers(): Promise<User[]> {
  const res = await axiosInstance.get('/engineers');
  return res.data.engineers;
}

export async function getEngineerCapacity(id: string): Promise<EngineerCapacity> {
  const res = await axiosInstance.get(`/engineers/${id}/capacity`);
  return res.data;
} 