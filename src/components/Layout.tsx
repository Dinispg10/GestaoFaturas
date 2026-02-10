import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/Button';
import { useIsManager } from '../hooks/useUser';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const isManager = useIsManager();

  const handleLogout = async () => {
    await signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="page-container">
      <header className="app-header">
        <div className="header-left">
          <div className="logo-section">
            <img src="/logo.svg" alt="Logo" className="header-logo" />
            <div>
              <h1 className="app-title">Farmácia Pinto</h1>
              <p className="app-subtitle">Registo de Faturas de Compra</p>
            </div>
          </div>
        </div>

        <nav className="header-nav">
          <Link
            to="/faturas"
            className={`nav-link ${isActive('/faturas') ? 'active' : ''}`}
          >
            Faturas
          </Link>
          <Link
            to="/fornecedores"
            className={`nav-link ${isActive('/fornecedores') ? 'active' : ''}`}
          >
            Fornecedores
          </Link>
          {isManager && (
            <Link
              to="/admin"
              className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="header-right">
          <span className="user-info">
            {user?.name} {user?.role === 'manager' && '(Gestor)'}
          </span>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </header>

      <main className="page-content">{children}</main>

      <style>{`
        .app-header {
          background: white;
          border-bottom: 1px solid #ddd;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .header-left {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-logo {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          background-color: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .app-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: #0066cc;
        }

        .app-subtitle {
          font-size: 12px;
          color: #666;
          margin: 2px 0 0 0;
        }

        .header-nav {
          display: flex;
          gap: 20px;
          margin: 0 40px;
        }

        .nav-link {
          color: #666;
          text-decoration: none;
          font-weight: 500;
          padding-bottom: 8px;
          border-bottom: 2px solid transparent;
          transition: all 0.3s ease;
        }

        .nav-link:hover {
          color: #0066cc;
        }

        .nav-link.active {
          color: #0066cc;
          border-bottom-color: #0066cc;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-info {
          font-size: 14px;
          color: #666;
        }

        @media (max-width: 768px) {
          .app-header {
            flex-direction: column;
            height: auto;
            padding: 12px;
            gap: 12px;
          }

          .header-nav {
            margin: 0;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};
