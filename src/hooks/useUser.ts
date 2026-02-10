import { useAuth } from '../context/AuthContext';
import { User, UserRole } from '../types';

export const useAuthUser = (): User | null => {
  const { user } = useAuth();
  return user;
};

export const useUserRole = (): UserRole | null => {
  const { user } = useAuth();
  return user?.role || null;
};

export const useIsManager = (): boolean => {
  const role = useUserRole();
  return role === 'manager';
};

export const useIsStaff = (): boolean => {
  const role = useUserRole();
  return role === 'staff';
};
