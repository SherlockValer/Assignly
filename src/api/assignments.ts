import axiosInstance from './axiosInstance';

interface Assignment {
  _id: string;
  engineerId: {
    _id: string;
    name: string;
    email?: string;
    seniority?: string;
    department?: string;
  };
  projectId: {
    _id: string;
    name: string;
    status?: string;
    requiredSkills?: string[];
    teamSize?: number;
  };
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  role: string;
}

export async function getAllAssignments(): Promise<Assignment[]> {
  const res = await axiosInstance.get('/assignments');
  return res.data.assignments;
}

export async function getAssignmentsByEngineer(engineerId: string): Promise<Assignment[]> {
  const res = await axiosInstance.get(`/assignments?engineerId=${engineerId}`);
  return res.data.assignments;
}

export async function createAssignment(assignment: Omit<Assignment, '_id'>): Promise<Assignment> {
  const res = await axiosInstance.post('/assignments', assignment);
  return res.data.assignment;
}

export async function updateAssignment(id: string, assignment: Partial<Assignment>): Promise<Assignment> {
  const res = await axiosInstance.put(`/assignments/${id}`, assignment);
  return res.data.assignment;
}

export async function deleteAssignment(id: string): Promise<void> {
  await axiosInstance.delete(`/assignments/${id}`);
}

export async function getAssignmentTimeline(): Promise<any[]> {
  const res = await axiosInstance.get('/assignments/timeline');
  return res.data.timeline;
} 