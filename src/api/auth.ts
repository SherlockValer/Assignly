import axios from 'axios';
import type { User } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export async function loginApi(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await axios.post(`${API_URL}/auth/login`, { email, password });
  return res.data;
} 