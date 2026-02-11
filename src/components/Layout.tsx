import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/Button';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();


  const handleLogout = async () => {
    await signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="page-container">
      <header className="app-header">
        <div className="header-left">
          <div className="logo-section">
            <img src="/logo.png" alt="Logo" className="header-logo" />
            <div>
              <h1 className="app-title">Farmácia Pinto</h1>
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
        </nav>

        <div className="header-right">
          <span className="user-info">
            {user?.name}
          </span>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </header>

      <main className="page-content">{children}</main>

      <style>{`
        .app-header {
          background: rgba(255, 255, 255, 0.95);
          border-bottom: 1px solid #ddd8e8;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 78px;
          backdrop-filter: blur(8px);
          box-shadow: 0 6px 18px rgba(37, 28, 57, 0.08);
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
          width: 52px;
          height: 52px;
          border-radius: 10px;
          background-color: #f2edf9;
          border: 1px solid #dfd6ef;
          object-fit: cover;
          object-position: center;
          transform: scale(1.04);
          box-shadow: 0 6px 14px rgba(91, 42, 134, 0.15);
        }

        .app-title {
          font-size: 17px;
          font-weight: 700;
          margin: 0;
          color: #4f2d74;
        }

        .app-subtitle {
          font-size: 12px;
          color: #677283;
          margin: 2px 0 0 0;
        }

        .header-nav {
          display: flex;
          gap: 10px;
          margin: 0 30px;
          background: #f4f1fa;
          border: 1px solid #e2daef;
          border-radius: 999px;
          padding: 6px;
        }

        .nav-link {
          color: #5f6374;
          text-decoration: none;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 999px;
          transition: all 0.25s ease;
        }

        .nav-link:hover {
          color: #4f2d74;
          background: #ebe4f7;
        }

        .nav-link.active {
          color: #fff;
          background: var(--color-primary);
          box-shadow: 0 8px 14px rgba(79, 45, 116, 0.22);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-info {
          font-size: 14px;
          color: #4f2d74;
          font-weight: 600;
        }

         @media (max-width: 900px) {
          .app-header {
            flex-direction: column;
            height: auto;
            padding: 12px;
            width: 100%;
            justify-content: center;
            flex-wrap: wrap;
            border-radius: 14px;
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
