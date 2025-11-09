import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const colors = {
  primary: '#FF8C00',
  secondary: '#FFE4B5',
  background: '#FFFEF7',
  foreground: '#2D1B69',
  card: '#FFFFFF',
  muted: '#F5F5DC',
  accent: '#FF9500',
  spiritual: '#FF8C00',
  sacred: '#FFD700',
  divine: '#FFA500',
  border: '#E6E6FA',
  text: '#1f2937',
};

export const gradients = {
  spiritual: ['#FF8C00', '#FF9500'] as const,
  sacred: ['#FFD700', '#FFE4B5'] as const,
  divine: ['#FFA500', '#FF8C00'] as const,
  hero: ['#FF8C00', '#FF9500', '#FFD700'] as const,
} as const;