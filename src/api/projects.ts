import axiosInstance from './axiosInstance';

interface Project {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  requiredSkills: string[];
  teamSize: number;
  status: 'planning' | 'active' | 'completed';
  managerId: string;
}

export async function getAllProjects(): Promise<Project[]> {
  const res = await axiosInstance.get('/projects');
  return res.data.projects;
}

export async function getProject(id: string): Promise<Project> {
  const res = await axiosInstance.get(`/projects/${id}`);
  return res.data.project;
}

export async function createProject(project: Omit<Project, '_id' | 'managerId'>): Promise<Project> {
  const res = await axiosInstance.post('/projects', project);
  return res.data.project;
}

export async function getSuitableEngineers(projectId: string) {
  const res = await axiosInstance.get(`/projects/${projectId}/suitable-engineers`);
  return res.data.engineers;
}

export async function getAllProjectsFiltered(params?: { status?: string; search?: string }): Promise<Project[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  // Optionally add more filters here
  const res = await axiosInstance.get(`/projects?${query.toString()}`);
  return res.data.projects;
} 