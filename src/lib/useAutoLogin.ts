'use client';

import { useEffect, useState } from 'react';
import { authAPI } from './api-fast';
import { authStorage } from './authStorage';
import Cookies from 'js-cookie';

export function useAutoLogin() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // Check if already logged in
      const token = Cookies.get('token') || Cookies.get('auth_token');
      if (token) {
        console.log('✅ Token found, user is authenticated');
        setIsAuthenticated(true);
        setIsChecking(false);
        return;
      }

      // Try to get stored auth
      const stored = authStorage.getAuth();
      if (stored && stored.isAuthenticated) {
        console.log('✅ Stored auth found');
        setIsAuthenticated(true);
        setIsChecking(false);
        return;
      }

      // Try auto-login with saved credentials
      console.log('🔐 Attempting auto-login...');
      const result = await authAPI.autoLogin();
      
      if (result && result.success && result.data && result.token) {
        console.log('✅ Auto-login successful');
        
        // Save auth data - normalize User to UserProfile
        if (result.data && result.token) {
          Cookies.set('token', result.token, { expires: 365 });
          Cookies.set('auth_token', result.token, { expires: 365 });
          
          // Convert User to UserProfile format
          const userProfile = {
            id: result.data.id,
            firstName: result.data.firstName,
            lastName: result.data.lastName,
            email: result.data.email,
            age: typeof result.data.age === 'string' ? parseInt(result.data.age) : result.data.age,
            gender: result.data.gender,
            country: result.data.country,
            state: result.data.state,
            city: result.data.city,
            position: result.data.position,
            positionType: result.data.positionType,
            style: result.data.style,
            preferredFoot: result.data.preferredFoot,
            shirtNumber: typeof result.data.shirtNumber === 'string' ? parseInt(result.data.shirtNumber) : result.data.shirtNumber,
            profilePicture: result.data.profilePicture,
            skills: result.data.skills,
            xp: result.data.xp
          };
          
          authStorage.saveAuthExact(
            userProfile,
            { 
              joinedLeagues: [], 
              managedLeagues: [], 
              homeTeamMatches: [], 
              awayTeamMatches: [] 
            },
            result.token
          );
        }
        
        setIsAuthenticated(true);
      } else {
        console.log('ℹ️ No auto-login available');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auto-login error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsChecking(false);
    }
  }

  return { isChecking, isAuthenticated };
}
