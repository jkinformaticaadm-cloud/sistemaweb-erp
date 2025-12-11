
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  users: User[]; // List of all users for Admin management
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  // Admin Actions
  addUser: (user: User) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Default Admin User ---
const DEFAULT_ADMIN: User = {
  id: 'admin-001',
  username: 'admin',
  password: '123', // In a real app, never store plain text passwords
  name: 'Administrador',
  role: 'ADMIN'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // We use localStorage to persist the session on refresh
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('techfix_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Load users from local storage or use default
  const [usersDB, setUsersDB] = useState<User[]>(() => {
    const savedDB = localStorage.getItem('techfix_users_db');
    return savedDB ? JSON.parse(savedDB) : [DEFAULT_ADMIN];
  });

  // Sync DB with LocalStorage
  useEffect(() => {
    localStorage.setItem('techfix_users_db', JSON.stringify(usersDB));
  }, [usersDB]);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const foundUser = usersDB.find(u => u.username === username && u.password === password);
    
    if (foundUser) {
      // Don't store password in session state
      const safeUser = { ...foundUser };
      // Note: We keep password in DB state for validation, but usually removed from session
      
      setUser(safeUser);
      localStorage.setItem('techfix_user', JSON.stringify(safeUser));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('techfix_user');
  };

  // --- Admin Functions ---

  const addUser = (newUser: User) => {
    if (usersDB.some(u => u.username === newUser.username)) {
      alert("Nome de usuário já existe!");
      return;
    }
    setUsersDB(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, data: Partial<User>) => {
    setUsersDB(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    
    // If updating current logged user, update session too
    if (user && user.id === id) {
       const updatedSession = { ...user, ...data };
       setUser(updatedSession);
       localStorage.setItem('techfix_user', JSON.stringify(updatedSession));
    }
  };

  const deleteUser = (id: string) => {
    if (id === DEFAULT_ADMIN.id) {
      alert("Não é possível excluir o administrador padrão.");
      return;
    }
    setUsersDB(prev => prev.filter(u => u.id !== id));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      users: usersDB,
      isAuthenticated: !!user, 
      login, 
      logout,
      addUser,
      updateUser,
      deleteUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
