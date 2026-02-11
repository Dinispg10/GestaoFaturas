import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { InvoicesPage } from '../pages/InvoicesPage';
import { InvoiceFormPage } from '../pages/InvoiceFormPage';
import { InvoiceDetailPage } from '../pages/InvoiceDetailPage';
import { SuppliersPage } from '../pages/SuppliersPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RequireAuth } from './RequireAuth';
import { Layout } from './Layout';
import { useAuth } from '../context/AuthContext';

export const Router: React.FC = () => {
  const { loading, error } = useAuth();

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <div className="text-center">
          <div className="spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <div className="text-center" style={{ maxWidth: '400px' }}>
          <h2>Erro de Autenticação</h2>
          <p style={{ color: '#d32f2f', marginBottom: '20px' }}>{error}</p>
          <p>Por favor, faça login novamente</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout>
              <Navigate to="/faturas" replace />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/faturas"
        element={
          <RequireAuth>
            <Layout>
              <InvoicesPage />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/faturas/nova"
        element={
          <RequireAuth>
            <Layout>
              <InvoiceFormPage />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/faturas/:id"
        element={
          <RequireAuth>
            <Layout>
              <InvoiceDetailPage />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/faturas/:id/editar"
        element={
          <RequireAuth>
            <Layout>
              <InvoiceFormPage />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/fornecedores"
        element={
          <RequireAuth>
            <Layout>
              <SuppliersPage />
            </Layout>
          </RequireAuth>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
