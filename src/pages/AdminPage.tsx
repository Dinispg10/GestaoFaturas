import React, { useEffect, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { userService } from '../features/users/userService';
import type { User, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'staff', label: 'Staff' },
  { value: 'manager', label: 'Gestor' },
];

export const AdminPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as UserRole,
  });

  useEffect(() => {
    void loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
      setErrors(['Erro ao carregar utilizadores']);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    const validation = userService.validateUserInput(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setCreating(true);
      await userService.createUser(formData);
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', role: 'staff' });
      setErrors([]);
      await loadUsers();
    } catch (error) {
      console.error(error);
      setErrors(['Erro ao criar utilizador. Verifique permissões no Supabase.']);
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      await userService.updateUserRole(userId, role);
      setUsers((prev) => prev.map((item) => (item.id === userId ? { ...item, role } : item)));
    } catch (error) {
      console.error(error);
      setErrors(['Erro ao atualizar role']);
    }
  };

  const handleDeleteUser = async (selectedUser: User) => {
    if (selectedUser.id === authUser?.id) {
      setErrors(['Não podes eliminar o teu próprio utilizador']);
      return;
    }

    const shouldDelete = window.confirm(`Tem a certeza que quer eliminar o utilizador ${selectedUser.name}?`);
    if (!shouldDelete) return;

    try {
      await userService.deleteUser(selectedUser.id);
      setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));
    } catch (error) {
      console.error(error);
      setErrors(['Erro ao eliminar utilizador']);
    }
  };

  const columns = [
    { key: 'name' as const, label: 'Nome' },
    { key: 'email' as const, label: 'Email' },
    {
      key: 'role' as const,
      label: 'Role',
      render: (value: unknown, row: User) => (
        <select
          value={value as UserRole}
          onChange={(event) => {
            event.stopPropagation();
            void handleRoleChange(row.id, event.target.value as UserRole);
          }}
          disabled={row.id === authUser?.id}
          style={{ minWidth: 130 }}
        >
          {ROLE_OPTIONS.map((roleOption) => (
            <option key={roleOption.value} value={roleOption.value}>
              {roleOption.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'active' as const,
      label: 'Estado',
      render: (value: unknown) => (
        <span className={`badge ${value ? 'badge-approved' : 'badge-inactive'}`}>
          {value ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      key: 'id' as const,
      label: 'Ações',
      render: (_value: unknown, row: User) => (
        <Button
          variant="danger"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            void handleDeleteUser(row);
          }}
          disabled={row.id === authUser?.id}
        >
          Eliminar
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h2 className="page-title">Admin - Role Manager</h2>
          <p className="page-subtitle">Gerir utilizadores: criar, eliminar e atribuir roles</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          + Novo Utilizador
        </Button>
      </div>

      {errors.length > 0 && (
        <div className="alert alert-error">
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="Sem utilizadores para mostrar"
      />

      <Modal
        isOpen={showCreateModal}
        title="Criar Utilizador"
        onClose={() => setShowCreateModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreateUser} loading={creating}>
              Criar
            </Button>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="userName">Nome</label>
          <input
            id="userName"
            value={formData.name}
            onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="userEmail">Email</label>
          <input
            id="userEmail"
            type="email"
            value={formData.email}
            onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="userPassword">Password</label>
          <input
            id="userPassword"
            type="password"
            value={formData.password}
            onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="userRole">Role</label>
          <select
            id="userRole"
            value={formData.role}
            onChange={(event) => setFormData((prev) => ({ ...prev, role: event.target.value as UserRole }))}
          >
            {ROLE_OPTIONS.map((roleOption) => (
              <option key={roleOption.value} value={roleOption.value}>
                {roleOption.label}
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  );
};