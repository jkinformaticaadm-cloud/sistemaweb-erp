
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase, toCamel, toSnake } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (user: User) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_ADMIN: User = {
  id: 'admin-001',
  username: 'admin',
  password: '123',
  name: 'Administrador',
  role: 'ADMIN'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('techfix_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [usersDB, setUsersDB] = useState<User[]>(() => {
    // Only used for fallback/cache
    const savedDB = localStorage.getItem('techfix_users_db');
    return savedDB ? JSON.parse(savedDB) : [DEFAULT_ADMIN];
  });

  useEffect(() => {
    if (supabase) {
        supabase.from('users').select('*').then(({ data }) => {
            if (data) setUsersDB(toCamel(data));
        });
    } else {
        localStorage.setItem('techfix_users_db', JSON.stringify(usersDB));
    }
  }, [usersDB]); // Dep triggers save to local only if changed locally

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let foundUser: User | undefined;

    if (supabase) {
        const { data } = await supabase.from('users').select('*').eq('username', username).eq('password', password).single();
        if (data) foundUser = toCamel(data);
    } else {
        foundUser = usersDB.find(u => u.username === username && u.password === password);
    }
    
    if (foundUser) {
      const safeUser = { ...foundUser };
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

  const addUser = async (newUser: User) => {
    if (usersDB.some(u => u.username === newUser.username)) {
      alert("Nome de usuário já existe!");
      return;
    }
    if(supabase) {
        await supabase.from('users').insert(toSnake(newUser));
        const {data} = await supabase.from('users').select('*');
        if(data) setUsersDB(toCamel(data));
    } else {
        setUsersDB(prev => [...prev, newUser]);
    }
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    if (supabase) {
        await supabase.from('users').update(toSnake(data)).eq('id', id);
        const {data: all} = await supabase.from('users').select('*');
        if(all) setUsersDB(toCamel(all));
    } else {
        setUsersDB(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    }
    
    if (user && user.id === id) {
       const updatedSession = { ...user, ...data };
       setUser(updatedSession);
       localStorage.setItem('techfix_user', JSON.stringify(updatedSession));
    }
  };

  const deleteUser = async (id: string) => {
    if (id === DEFAULT_ADMIN.id && !supabase) {
      alert("Não é possível excluir o administrador padrão no modo local.");
      return;
    }
    if (supabase) {
        await supabase.from('users').delete().eq('id', id);
        const {data: all} = await supabase.from('users').select('*');
        if(all) setUsersDB(toCamel(all));
    } else {
        setUsersDB(prev => prev.filter(u => u.id !== id));
    }
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
