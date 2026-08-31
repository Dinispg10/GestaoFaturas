import React, { useState, useEffect } from 'react';
import { supplierService } from '../features/suppliers/supplierService';
import { Supplier } from '../types';
import { Button } from '../components/Button';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { supabase } from '../lib/supabase';

interface SupplierStats {
  count: number;
  total: number;
  pending: number;
}

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<Record<string, SupplierStats>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    active: true,
  });
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const [data, invoicesRes] = await Promise.all([
        supplierService.getAllSuppliers(),
        supabase.from('invoices').select('supplier_id, total_amount, status'),
      ]);
      setSuppliers(data);

      const map: Record<string, SupplierStats> = {};
      for (const row of invoicesRes.data ?? []) {
        const s = map[row.supplier_id] ?? { count: 0, total: 0, pending: 0 };
        s.count += 1;
        s.total += row.total_amount || 0;
        if (row.status === 'submitted') s.pending += row.total_amount || 0;
        map[row.supplier_id] = s;
      }
      setStats(map);
    } catch (error) {
      console.error('[SuppliersPage] Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingId(supplier.id);
      setFormData({
        name: supplier.name,
        active: supplier.active,
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', active: true });
    }
    setErrors([]);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', active: true });
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
        await supplierService.createSupplier(formData);
      }
      handleCloseModal();
      loadSuppliers();
    } catch (error) {
      setErrors(['Erro ao guardar fornecedor']);
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;

    const shouldDelete = window.confirm('Tem a certeza que quer eliminar este fornecedor?');
    if (!shouldDelete) return;

    try {
      await supplierService.deleteSupplier(editingId);
      handleCloseModal();
      loadSuppliers();
    } catch (error) {
      setErrors(['Erro ao eliminar fornecedor']);
      console.error(error);
    }
  };

  const fmt = (n: number) =>
    n.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

  const columns = [
    { key: 'name' as const, label: 'Nome' },
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
      label: 'Faturas',
      render: (_: unknown, row: Supplier) => {
        const s = stats[row.id];
        return (
          <span style={{ fontWeight: 600, color: '#4a3f83' }}>
            {s ? s.count : '—'}
          </span>
        );
      },
    },
    {
      key: 'id' as const,
      label: 'Total Faturado',
      render: (_: unknown, row: Supplier) => {
        const s = stats[row.id];
        return s ? fmt(s.total) : '—';
      },
    },
    {
      key: 'id' as const,
      label: 'Pendente',
      render: (_: unknown, row: Supplier) => {
        const s = stats[row.id];
        if (!s) return '—';
        return s.pending > 0 ? (
          <span style={{ fontWeight: 600, color: '#f57c00' }}>{fmt(s.pending)}</span>
        ) : (
          <span style={{ color: '#2d9f6d', fontWeight: 600 }}>0,00€</span>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h2 className="page-title">Fornecedores</h2>
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
            {editingId && (
              <Button variant="danger" onClick={handleDelete}>
                Eliminar
              </Button>
            )}
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
          <label htmlFor="active">Estado</label>
          <select
            id="active"
            value={formData.active ? 'true' : 'false'}
            onChange={(e) =>
              setFormData({
                ...formData,
                active: e.target.value === 'true',
              })
            }
          >
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>

        <style>{`
          
          .alert-error ul {
            margin: 0;
            padding-left: 20px;
          }

        `}</style>
      </Modal>
    </div>
  );
};
