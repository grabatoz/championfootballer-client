import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { authAPI } from "../api"
import Cookies from "js-cookie"
import type { AuthState, LoginCredentials, RegisterCredentials, ApiResponse } from "@/types/api"
import type { User } from "@/types/user"
import { authStorage, type UserDataShape, type UserProfile } from "../authStorage"

// Define proper types for token extraction
interface TokenResponse {
  token?: string
  accessToken?: string
  jwt?: string
  data?: {
    token?: string
    accessToken?: string
    jwt?: string
  }
}

// Define normalized user interface - override specific properties
// interface NormalizedUser extends Omit<User, 'age' | 'shirtNumber'> {
//   age?: number;
//   shirtNumber?: number;
// }

// Update the AuthState to use UserDataShape from authStorage and UserProfile for user
interface TypedAuthState extends Omit<AuthState, 'userData' | 'user'> {
  userData: UserDataShape;
  user: UserProfile | null;
}

// Initial state without any client-side data
const initialState: TypedAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  userData: {
    joinedLeagues: [],
    managedLeagues: [],
    homeTeamMatches: [],
    awayTeamMatches: [],
    availableMatches: [],
    guestMatch: null,
  },
}

// Helper: extract token from various backend shapes
const extractTokenFromResponse = (payload: TokenResponse): string | null => {
  const candidates = [
    payload?.token,
    payload?.accessToken,
    payload?.jwt,
    payload?.data?.token,
    payload?.data?.accessToken,
    payload?.data?.jwt,
  ]
  for (const t of candidates) {
    if (typeof t === "string" && t.length > 0) return t
  }
  return null
}

// Helper: check if session is expired (7 days window saved in localStorage)
const isSessionExpired = (): boolean => {
  if (typeof window === "undefined") return true
  const iso = localStorage.getItem("sessionExpiry")
  if (!iso) return true // no expiry saved yet -> treat as expired
  const expiry = new Date(iso).getTime()
  const now = Date.now()
  return Number.isFinite(expiry) ? now > expiry : true
}

// Helper to normalize User to UserProfile
const normalizeUserForStorage = (user: User): UserProfile => {
  // Type assertion to access potentially missing properties
  const userWithImage = user as User & { image?: string };
  
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    age: typeof user.age === "string" ? Number(user.age) || undefined : user.age,
    gender: user.gender,
    position: user.position,
    positionType: user.positionType,
    style: user.style,
    preferredFoot: user.preferredFoot,
    shirtNumber: typeof user.shirtNumber === "string" ? Number(user.shirtNumber) || undefined : user.shirtNumber,
    profilePicture: user.profilePicture || null,
    image: userWithImage.image || user.profilePicture || null,
    skills: user.skills,
  }
}

const syncStateWithStorage = (state: TypedAuthState): void => {
  if (typeof window === "undefined") return

  // If no auth signal at all (no token and not authenticated), clear storage
  if (!state.isAuthenticated && !state.token) {
    Cookies.remove("token", { path: "/" })
    Cookies.remove("auth_token", { path: "/" })
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("userData")
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("sessionExpiry")
    localStorage.removeItem("authData")
    sessionStorage.removeItem("authData")
    return
  }

  if (state.token && state.user && state.userData) {
    authStorage.saveAuthExact(state.user, state.userData, state.token)
  }
}

const loadSessionFromStorage = (): TypedAuthState => {
  if (typeof window === "undefined") return initialState

  if (isSessionExpired()) {
    // clear any stale data
    Cookies.remove("token", { path: "/" })
    Cookies.remove("auth_token", { path: "/" })
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("userData")
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("sessionExpiry")
    localStorage.removeItem("authData")
    sessionStorage.removeItem("authData")
    return initialState
  }

  // Use unified authStorage to get auth data
  const authData = authStorage.getAuth()

  if (authData && authData.token && authData.user) {
    return {
      user: authData.user,
      userData: authData.userData || initialState.userData,
      token: authData.token,
      isAuthenticated: true,
      loading: false,
      error: null,
    }
  }

  return initialState
}

// Helper to normalize API response data to UserDataShape
const normalizeUserData = (data: User | undefined | null): UserDataShape => {
  if (!data) return initialState.userData;
  
  return {
    joinedLeagues: (data.joinedLeagues || []).map(league => ({
      id: String(league.id || ''),
      name: league.name || '',
    })),
    managedLeagues: (data.managedLeagues || []).map(league => ({
      id: String(league.id || ''),
      name: league.name || '',
    })),
    homeTeamMatches: (data.homeTeamMatches || []).map(match => ({
      id: String(match.id || ''),
      homeTeamGoals: Number(match.homeTeamGoals || 0),
      awayTeamGoals: Number(match.awayTeamGoals || 0),
      status: (match.status as 'RESULT_PUBLISHED' | 'SCHEDULED' | 'ONGOING') || 'SCHEDULED',
    })),
    awayTeamMatches: (data.awayTeamMatches || []).map(match => ({
      id: String(match.id || ''),
      homeTeamGoals: Number(match.homeTeamGoals || 0),
      awayTeamGoals: Number(match.awayTeamGoals || 0),
      status: (match.status as 'RESULT_PUBLISHED' | 'SCHEDULED' | 'ONGOING') || 'SCHEDULED',
    })),
    availableMatches: (data.availableMatches || []).map(match => ({
      id: String(match.id || ''),
      homeTeamGoals: Number(match.homeTeamGoals || 0),
      awayTeamGoals: Number(match.awayTeamGoals || 0),
      status: (match.status as 'RESULT_PUBLISHED' | 'SCHEDULED' | 'ONGOING') || 'SCHEDULED',
    })),
    guestMatch: data.guestMatch ? {
      id: String(data.guestMatch.id || ''),
      homeTeamGoals: Number(data.guestMatch.homeTeamGoals || 0),
      awayTeamGoals: Number(data.guestMatch.awayTeamGoals || 0),
      status: (data.guestMatch.status as 'RESULT_PUBLISHED' | 'SCHEDULED' | 'ONGOING') || 'SCHEDULED',
    } : null,
  };
}

export const login = createAsyncThunk<ApiResponse<User>, LoginCredentials>("auth/login", async (credentials) => {
  const response = await authAPI.login(credentials)
  return response
})

export const register = createAsyncThunk<ApiResponse<User>, RegisterCredentials>(
  "auth/register",
  async (credentials) => {
    const response = await authAPI.register(credentials)
    return response
  },
)

export const checkAuth = createAsyncThunk<ApiResponse<User>>("auth/check", async () => {
  // Check if session is expired
  if (isSessionExpired()) {
    return {
      success: false,
      message: "Session expired",
      error: "Session expired",
    }
  }
  const response = await authAPI.checkAuth()

  if (response.success && response.data) {
    const userData = normalizeUserData(response.data)

    // Get token from cookies or localStorage
    const token = Cookies.get("token") || Cookies.get("auth_token") || localStorage.getItem("token")
    if (token) {
      // Normalize user before saving
      const normalizedUser = normalizeUserForStorage(response.data)
      authStorage.saveAuthExact(normalizedUser, userData, token)
    }
  }

  return response
})

export const logout = createAsyncThunk<{ success: boolean }>("auth/logout", async () => {
  if (typeof window !== "undefined") {
    Cookies.remove("token", { path: "/" })
    Cookies.remove("auth_token", { path: "/" })
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("userData")
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("sessionExpiry")
    localStorage.removeItem("authData")
    sessionStorage.removeItem("authData")
  }
  return { success: true }
})

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    syncWithStorage: (state) => {
      syncStateWithStorage(state)
    },
    initializeFromStorage: (state) => {
      const sessionState = loadSessionFromStorage()
      state.user = sessionState.user
      state.userData = sessionState.userData
      state.token = sessionState.token
      state.isAuthenticated = sessionState.isAuthenticated
      state.loading = sessionState.loading
      state.error = sessionState.error
    },
    // NEW: merge incoming fields into current user and keep store hot
    mergeUser: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (!state.user) {
        state.user = action.payload as UserProfile
      } else {
        state.user = { ...state.user, ...action.payload }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.success) {
          state.token = extractTokenFromResponse(action.payload as TokenResponse)
          state.isAuthenticated = Boolean(state.token) || true
          state.user = action.payload.data ? normalizeUserForStorage(action.payload.data) : null
          state.userData = normalizeUserData(action.payload.data)
          state.error = null
          syncStateWithStorage(state)
        } else {
          state.error = action.payload.error || "Login failed"
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Login failed"
      })
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.token = extractTokenFromResponse(action.payload as TokenResponse)
        state.isAuthenticated = Boolean(state.token) || true
        state.user = action.payload.data ? normalizeUserForStorage(action.payload.data) : null
        state.userData = normalizeUserData(action.payload.data)
        state.error = null
        syncStateWithStorage(state)
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Registration failed"
      })
      .addCase(checkAuth.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.success) {
          state.isAuthenticated = true
          state.user = action.payload.data ? normalizeUserForStorage(action.payload.data) : null
          state.userData = normalizeUserData(action.payload.data)
          // Keep any existing token; try to hydrate from cookie/LS if missing
          state.token =
            state.token || Cookies.get("token") || Cookies.get("auth_token") || localStorage.getItem("token") || null
          state.error = null
          syncStateWithStorage(state)
        } else {
          state.isAuthenticated = false
          state.user = null
          state.userData = initialState.userData
          state.token = null
          state.error = action.payload.error || "Authentication check failed"
          syncStateWithStorage(state)
        }
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.userData = initialState.userData
        state.error = action.error.message || "Authentication check failed"
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false
        state.user = null
        state.userData = initialState.userData
        state.token = null
        state.error = null
        if (typeof window !== "undefined") {
          Cookies.remove("token", { path: "/" })
          Cookies.remove("auth_token", { path: "/" })
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          localStorage.removeItem("userData")
          localStorage.removeItem("isAuthenticated")
          localStorage.removeItem("sessionExpiry")
          localStorage.removeItem("authData")
          sessionStorage.removeItem("authData")
        }
      })
  },
})

export const { clearError, syncWithStorage, initializeFromStorage, mergeUser } = authSlice.actions
export default authSlice.reducer