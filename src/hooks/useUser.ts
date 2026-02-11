import { useAuth } from '../context/AuthContext';
import { User } from '../types';

export const useAuthUser = (): User | null => {
  const { user } = useAuth();
  return user;
};
