import { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { connectSocket, disconnectSocket, isSocketConnected } from '../utils/socket';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  profilePictureUrl?: string;
  coins?: number;
}

interface AuthContextType {
  user: User | null;
  error: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, profilePictureUrl?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const initializationComplete = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (initializationComplete.current) {
        return;
    }
    initializationComplete.current = true;
    
    setIsLoading(true);
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (isSocketConnected()) {
        if (token && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (isMounted.current) setUser(parsedUser);
            } catch (e) {
                 localStorage.removeItem('token');
                 localStorage.removeItem('user');
                 if (isMounted.current) setUser(null);
            }
        }
        if (isMounted.current) setIsLoading(false);
        return;
    }

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
         if (isMounted.current) setUser(parsedUser);

         connectSocket(token)
           .then(socket => {
             if (socket && isMounted.current) {
               
             } else if (isMounted.current){
               setError('Failed to establish real-time connection.');
             }
           })
           .catch(err => {
             if (isMounted.current) {
                 localStorage.removeItem('token');
                 localStorage.removeItem('user');
                 setUser(null);
                 setError('Session invalid. Please log in again.');
             }
           })
           .finally(() => {
               if (isMounted.current) setIsLoading(false);
           });
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (isMounted.current) setUser(null);
        if (isMounted.current) setIsLoading(false); 
      }
    } else {
      if (isMounted.current) setIsLoading(false); 
    }
  }, []);

  const performLogin = async (userData: { token: string; user: User }) => {
      const { token, user: loggedInUser } = userData;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      if (isMounted.current) setUser(loggedInUser);
      if (isMounted.current) setError(null);
      if (isMounted.current) setIsLoading(true); 
      try {
          disconnectSocket(); 
          await connectSocket(token);
          if (isMounted.current) navigate('/home');
      } catch (socketError) {
           if (isMounted.current) setError('Login successful, but failed to connect to real-time services.');
           if (isMounted.current) navigate('/home'); 
      } finally {
          if (isMounted.current) setIsLoading(false);
      }
  };

  const login = async (username: string, password: string) => {
    if (isMounted.current) setIsLoading(true);
    if (isMounted.current) setError(null);
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });
      await performLogin(response.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      if (isMounted.current) setError(errorMessage);
      throw new Error(errorMessage); 
    } 
  };

  const signup = async (username: string, password: string, profilePictureUrl?: string) => {
     if (isMounted.current) setIsLoading(true);
     if (isMounted.current) setError(null);
    try {
      const response = await axios.post('/api/auth/signup', {
        username,
        password,
        profilePictureUrl
      });
       await performLogin(response.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Signup failed';
      if (isMounted.current) setError(errorMessage);
      throw new Error(errorMessage); 
    } 
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (isMounted.current) setUser(null);
    if (isMounted.current) setError(null);
    disconnectSocket(); 
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, error, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 