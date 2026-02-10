import { supabase } from '../../lib/supabase';
import type { Supplier } from '../../types';

interface SupplierInput {
  name: string;
  email?: string;
  phone?: string;
  active?: boolean;
}

interface SupplierDB {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Validação de email
 */
function validateEmail(email: string): boolean {
  if (!email) return true; // Email é opcional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validação de telefone (mínimo 9 dígitos)
 */
function validatePhone(phone: string): boolean {
  if (!phone) return true; // Telefone é opcional
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 9;
}

/**
 * Converte dados do Supabase (snake_case) para TypeScript (camelCase)
 */
function mapSupplierFromDB(data: SupplierDB): Supplier {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    active: data.active,
    created_at: new Date(data.created_at),
  };
}

/**
 * Serviço de fornecedores
 */
export const supplierService = {
  /**
   * Valida dados de fornecedor
   */
  validateSupplier(data: SupplierInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Nome do fornecedor é obrigatório');
    }

    if (data.email && !validateEmail(data.email)) {
      errors.push('Email inválido');
    }

    if (data.phone && !validatePhone(data.phone)) {
      errors.push('Telefone inválido (mínimo 9 dígitos)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Cria um novo fornecedor
   */
  async createSupplier(data: SupplierInput): Promise<Supplier> {
    const validation = this.validateSupplier(data);
    if (!validation.valid) {
      throw new Error(`Validação falhou: ${validation.errors.join(', ')}`);
    }

    const supplierData = {
      ...data,
      active: data.active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdData, error } = await supabase
      .from('suppliers')
      .insert([supplierData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar fornecedor:', error);
      throw error;
    }

    return mapSupplierFromDB(createdData as SupplierDB);
  },

  /**
   * Atualiza um fornecedor existente
   */
  async updateSupplier(id: string, data: Partial<SupplierInput>): Promise<Supplier> {
    if (data.email && !validateEmail(data.email)) {
      throw new Error('Email inválido');
    }

    if (data.phone && !validatePhone(data.phone)) {
      throw new Error('Telefone inválido');
    }

    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedData, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      throw error;
    }

    if (!updatedData) {
      throw new Error('Fornecedor não encontrado');
    }

    return mapSupplierFromDB(updatedData as SupplierDB);
  },

  /**
   * Obtém um fornecedor pelo ID
   */
  async getSupplier(id: string): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao obter fornecedor:', error);
      throw error;
    }

    if (!data) {
      return null;
    }

    return mapSupplierFromDB(data as SupplierDB);
  },

  /**
   * Obtém todos os fornecedores ordenados por nome
   */
  async getAllSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao obter fornecedores:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((item: SupplierDB) => mapSupplierFromDB(item));
  },

  /**
   * Obtém todos os fornecedores ativos ordenados por nome
   */
  async getActiveSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao obter fornecedores ativos:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((item: SupplierDB) => mapSupplierFromDB(item));
  },
};
