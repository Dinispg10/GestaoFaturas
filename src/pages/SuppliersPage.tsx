import React, { useState, useEffect } from 'react';
import { supplierService } from '../features/suppliers/supplierService';
import { Supplier } from '../types';
import { Button } from '../components/Button';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      console.log('[SuppliersPage] Starting loadSuppliers...');
      setLoading(true);
      const data = await supplierService.getActiveSuppliers();
      console.log('[SuppliersPage] Got suppliers:', data.length);
      setSuppliers(data);
    } catch (error) {
      console.error('[SuppliersPage] Error loading suppliers:', error);
    } finally {
      setLoading(false);
      console.log('[SuppliersPage] setLoading(false)');
    }
  };

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingId(supplier.id);
      setFormData({
        name: supplier.name,
        email: supplier.email || '',
        phone: supplier.phone || '',
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', email: '', phone: '' });
    }
    setErrors([]);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '' });
    setErrors([]);
  };

  const handleSave = async () => {
    const validation = supplierService.validateSupplier(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    try {
      if (editingId) {
        await supplierService.updateSupplier(editingId, formData);
      } else {
        await supplierService.createSupplier({ ...formData, active: true });
      }
      handleCloseModal();
      loadSuppliers();
    } catch (error) {
      setErrors(['Erro ao guardar fornecedor']);
      console.error(error);
    }
  };

  const columns = [
    { key: 'name' as const, label: 'Nome' },
    { key: 'email' as const, label: 'Email' },
    { key: 'phone' as const, label: 'Telefone' },
    {
      key: 'active' as const,
      label: 'Estado',
      render: (value: unknown) => (
        <span className={`badge ${value ? 'badge-approved' : 'badge-draft'}`}>
          {value ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h2 className="page-title">Fornecedores</h2>
          <p className="page-subtitle">Total: {suppliers.length} fornecedores</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          + Novo Fornecedor
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        loading={loading}
        onRowClick={(supplier) => handleOpenModal(supplier)}
        emptyMessage="Nenhum fornecedor registado"
      />

      <Modal
        isOpen={showModal}
        title={editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        onClose={handleCloseModal}
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Guardar
            </Button>
          </div>
        }
      >
        {errors.length > 0 && (
          <div className="alert alert-error">
            <ul>
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="name">Nome *</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Telefone</label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <style>{`
          .form-group {
            margin-bottom: 16px;
          }

          .form-group label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
          }

          .form-group input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          }

          .alert {
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 16px;
          }

          .alert-error {
            background-color: #ffebee;
            color: #d32f2f;
            border: 1px solid #f5a5a5;
          }

          .alert-error ul {
            margin: 0;
            padding-left: 20px;
          }

          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
          }

          .badge-approved {
            background-color: #d4edda;
            color: #155724;
          }

          .badge-draft {
            background-color: #e0e0e0;
            color: #333;
          }

          .flex-between {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 24px;
          }

          .page-title {
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 8px 0;
          }

          .page-subtitle {
            font-size: 14px;
            color: #666;
            margin: 0;
          }

          .mb-4 {
            margin-bottom: 16px;
          }
        `}</style>
      </Modal>
    </div>
  );
};
