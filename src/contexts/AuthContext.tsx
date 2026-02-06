import React, { createContext, useContext, useState, useCallback } from 'react';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  university?: string;
  course?: string;
  yearOfStudy?: number;
  profilePicture?: string;
  bio?: string;
  isSuspended: boolean;
  isOnline: boolean;
  createdAt: Date;
}

interface SignupData {
  username: string;
  name: string;
  email: string;
  password: string;
  university: string;
  course: string;
  yearOfStudy: number;
}

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  signup: (data: SignupData) => { success: boolean; error?: string };
  logout: () => void;
  suspendUser: (userId: string) => void;
  unsuspendUser: (userId: string) => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const INITIAL_USERS: (User & { password: string })[] = [
  {
    id: '1',
    username: 'admin',
    name: 'Platform Admin',
    email: 'admin@uniconnect.edu',
    role: 'admin',
    isSuspended: false,
    isOnline: true,
    password: 'admin123',
    profilePicture: '',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    username: 'sarah_cs',
    name: 'Sarah Johnson',
    email: 'sarah@mit.edu',
    role: 'student',
    university: 'MIT',
    course: 'Computer Science',
    yearOfStudy: 3,
    bio: 'CS junior passionate about AI and web dev 🚀',
    isSuspended: false,
    isOnline: true,
    password: 'pass123',
    profilePicture: '',
    createdAt: new Date('2024-06-15'),
  },
  {
    id: '3',
    username: 'mike_eng',
    name: 'Mike Chen',
    email: 'mike@stanford.edu',
    role: 'student',
    university: 'Stanford',
    course: 'Electrical Engineering',
    yearOfStudy: 2,
    bio: 'Building the future, one circuit at a time ⚡',
    isSuspended: false,
    isOnline: false,
    password: 'pass123',
    profilePicture: '',
    createdAt: new Date('2024-08-20'),
  },
  {
    id: '4',
    username: 'emma_bio',
    name: 'Emma Williams',
    email: 'emma@harvard.edu',
    role: 'student',
    university: 'Harvard',
    course: 'Biology',
    yearOfStudy: 4,
    bio: 'Pre-med student | Coffee addict ☕ | Lab rat 🧬',
    isSuspended: false,
    isOnline: true,
    password: 'pass123',
    profilePicture: '',
    createdAt: new Date('2024-03-10'),
  },
  {
    id: '5',
    username: 'alex_math',
    name: 'Alex Rivera',
    email: 'alex@caltech.edu',
    role: 'student',
    university: 'Caltech',
    course: 'Mathematics',
    yearOfStudy: 1,
    bio: 'Freshman exploring the beauty of pure mathematics 📐',
    isSuspended: false,
    isOnline: true,
    password: 'pass123',
    profilePicture: '',
    createdAt: new Date('2025-09-01'),
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = useCallback((username: string, password: string) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return { success: false, error: 'Invalid username or password' };
    if (user.isSuspended) return { success: false, error: 'Your account has been suspended. Contact admin.' };

    const { password: _, ...userData } = user;
    setCurrentUser({ ...userData, isOnline: true });
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isOnline: true } : u));
    return { success: true };
  }, [users]);

  const signup = useCallback((data: SignupData) => {
    const exists = users.some(u => u.username === data.username || u.email === data.email);
    if (exists) return { success: false, error: 'Username or email already exists' };

    const newUser = {
      id: String(Date.now()),
      username: data.username,
      name: data.name,
      email: data.email,
      role: 'student' as const,
      university: data.university,
      course: data.course,
      yearOfStudy: data.yearOfStudy,
      isSuspended: false,
      isOnline: true,
      password: data.password,
      profilePicture: '',
      createdAt: new Date(),
    };

    setUsers(prev => [...prev, newUser]);
    const { password: _, ...userData } = newUser;
    setCurrentUser(userData);
    return { success: true };
  }, [users]);

  const logout = useCallback(() => {
    if (currentUser) {
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, isOnline: false } : u));
    }
    setCurrentUser(null);
  }, [currentUser]);

  const suspendUser = useCallback((userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: true } : u));
  }, []);

  const unsuspendUser = useCallback((userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: false } : u));
  }, []);

  const updateProfile = useCallback((data: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...data } : u));
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      users: users.map(({ password: _, ...u }) => u) as User[],
      isAuthenticated: !!currentUser,
      isAdmin: currentUser?.role === 'admin',
      login,
      signup,
      logout,
      suspendUser,
      unsuspendUser,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};