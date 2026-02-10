import { supabase } from '../../lib/supabase';
import type { User, UserRole } from '../../types';

interface UserDB {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const mapUserFromDB = (data: UserDB): User => ({
  id: data.id,
  name: data.name,
  email: data.email,
  role: data.role,
  active: data.active,
});

export const userService = {
  validateUserInput(data: CreateUserInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name.trim()) {
      errors.push('Nome é obrigatório');
    }

    if (!data.email.trim()) {
      errors.push('Email é obrigatório');
    }

    if (!data.password || data.password.length < 6) {
      errors.push('Password deve ter pelo menos 6 caracteres');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, active')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map((user) => mapUserFromDB(user as UserDB));
  },

  async createUser(data: CreateUserInput): Promise<User> {
    const validation = this.validateUserInput(data);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    const currentSessionResult = await supabase.auth.getSession();
    const currentSession = currentSessionResult.data.session;

    const { data: createdAuthData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.name,
        },
      },
    });

    if (authError) {
      throw authError;
    }

    if (!createdAuthData.user?.id) {
      throw new Error('Não foi possível criar o utilizador na autenticação');
    }

    const { data: createdProfile, error: profileError } = await supabase
      .from('users')
      .upsert(
        {
          id: createdAuthData.user.id,
          name: data.name,
          email: data.email,
          role: data.role,
          active: true,
        },
        { onConflict: 'id' },
      )
      .select('id, name, email, role, active')
      .single();

    if (currentSession) {
      await supabase.auth.setSession({
        access_token: currentSession.access_token,
        refresh_token: currentSession.refresh_token,
      });
    }

    if (profileError || !createdProfile) {
      throw profileError || new Error('Falha ao criar perfil do utilizador');
    }

    return mapUserFromDB(createdProfile as UserDB);
  },

  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;
  },

  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  },
};