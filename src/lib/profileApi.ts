import { ApiResponse } from '@/types/api';
import { User } from '@/types/user';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const profileAPI = {
  getProfile: async (): Promise<ApiResponse<User>> => {
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.user,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profile'
      };
    }
  },

  updateProfile: async (userData: Partial<User>): Promise<ApiResponse<User>> => {
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.user,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile'
      };
    }
  },

  updateSkills: async (skills: {
    dribbling: number;
    shooting: number;
    passing: number;
    pace: number;
    defending: number;
    physical: number;
  }): Promise<ApiResponse<User>> => {
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${API_BASE_URL}/profile/skills`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ skills })
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data.user,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update skills'
      };
    }
  }
}; 