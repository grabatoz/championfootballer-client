import { Middleware, AnyAction } from '@reduxjs/toolkit';
import { authAPI } from '../api';
import { RegisterCredentials } from '@/types/api';

interface ApiRequest<T = unknown> {
  type: string;
  payload: T;
}


interface ApiAction<T = unknown> extends AnyAction {
  request: ApiRequest<T>;
}


export const apiMiddleware: Middleware = () => next => async (action: unknown) => {
  // Type guard to check if action is ApiAction with request
  if (!action || typeof action !== 'object' || !('request' in action) || !action.request) {
    return next(action as AnyAction);
  }

  const apiAction = action as ApiAction;
  const { request, ...rest } = apiAction;
  const { type, payload } = request;

  // Dispatch pending action
  next({ ...rest, type: `${type}/pending` });

  try {
    let response;
    
    // Handle different API calls
    switch (type) {
      case 'auth/login':
        if (typeof payload === 'object' && payload !== null && 'email' in payload && 'password' in payload) {
          const { email, password } = payload as { email: string; password: string };
          response = await authAPI.login({ email, password });
        } else {
          throw new Error('Invalid login payload');
        }
        break;
      case 'auth/signup':
        response = await authAPI.register(payload as RegisterCredentials);
        break;
      case 'auth/logout':
        if (typeof payload === 'string') {
          response = await authAPI.logout(payload);
        } else {
          throw new Error('Invalid logout payload');
        }
        break;
      default:
        throw new Error(`Unknown API call: ${type}`);
    }

    // Dispatch success action with response data
    return next({
      ...rest,
      type: `${type}/fulfilled`,
      payload: response
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'An error occurred';
  
    return next({
      ...rest,
      type: `${type}/rejected`,
      error: message
    });
  }  
}; 