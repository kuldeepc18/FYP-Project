import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  name: string;
  balance: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Initialize state from localStorage
const getInitialState = (): AuthState => {
  try {
    const stored = localStorage.getItem('ktrade_auth');
    if (stored) {
      const authData = JSON.parse(stored);
      console.log('[AuthSlice] Initializing from localStorage:', authData);
      return {
        user: authData.user,
        token: authData.token,
        isAuthenticated: true,
      };
    }
  } catch (error) {
    console.error('[AuthSlice] Error parsing stored auth:', error);
  }
  
  console.log('[AuthSlice] No stored auth found, using default state');
  return {
    user: null,
    token: null,
    isAuthenticated: false,
  };
};

const initialState: AuthState = getInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: User; token: string }>) => {
      console.log('[AuthSlice] Setting auth state:', action.payload);
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      console.log('[AuthSlice] Clearing auth state');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
