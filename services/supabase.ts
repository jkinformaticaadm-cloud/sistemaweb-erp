
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
// Chaves configuradas diretamente conforme solicitado
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://mrnjondokgivokcjgrmh.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ybmpvbmRva2dpdm9rY2pncm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTM5MzcsImV4cCI6MjA4MDQyOTkzN30.GaMOruMvt5KsOVq2jpuErqFGUppOd8PCF19w7XGrA4A';

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// Utilitários para converter camelCase (Frontend) <-> snake_case (Banco)

export const toSnake = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(v => toSnake(v));
  if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnake(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

export const toCamel = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(v => toCamel(v));
  if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      result[camelKey] = toCamel(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};
