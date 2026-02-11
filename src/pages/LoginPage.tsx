import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login';
      const normalizedMessage = errorMessage.toLowerCase();

      if (
        normalizedMessage.includes('credenciais inválidas') ||
        normalizedMessage.includes('invalid login credentials') ||
        normalizedMessage.includes('invalid credentials')
      ) {
        setError('Credenciais inválidas. Verifique o email e a senha.');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-placeholder">
             <img src="/logo.png" alt="Farmácia Pinto" className="login-logo" />
          </div>
          <h1>Farmácia Pinto</h1>
          <p>Registo de Faturas</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button variant="primary" type="submit" loading={loading} style={{ width: '100%' }}>
            Entrar
          </Button>
        </form>
      </div>

      <style>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          overflow: hidden;
          background: var(--color-primary);
          padding: 20px;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 18px;
          border: 1px solid #ddd8e8;
          box-shadow: 0 22px 45px rgba(29, 20, 45, 0.28);
          width: 100%;
          max-width: 430px;
          padding: 38px;
          backdrop-filter: blur(8px);
        }

        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }

       .logo-placeholder {
          width: 140px;
          height: 112px;
          background: linear-gradient(135deg, #f4f1fa 0%, #eef7f4 100%);
          border: 1px solid #ddd6ee;
          border-radius: 14px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          box-shadow: 0 10px 18px rgba(65, 40, 98, 0.14);
        }

        .login-logo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transform: scale(1.08);
        }

        .login-header h1 {
          font-size: 30px;
          margin-bottom: 8px;
          letter-spacing: 0.2px;
          color: #4f2d74;
        }

        .login-header p {
          color: #5d6b7a;
          font-size: 15px;
        }

        .login-footer {
          text-align: center;
          margin-top: 26px;
          padding-top: 18px;
          border-top: 1px solid #e7e0f3;
          color: #768293;
          font-size: 12px;
        }

        .login-footer p {
          margin: 0;
        }
      `}</style>
    </div>
  );
};
