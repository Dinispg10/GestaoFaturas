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
      if (errorMessage.includes('user-not-found')) {
        setError('Utilizador não encontrado');
      } else if (errorMessage.includes('wrong-password')) {
        setError('Senha incorreta');
      } else if (errorMessage.includes('invalid-email')) {
        setError('Email inválido');
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
            <img src="/logo.svg" alt="Farmácia Pinto" style={{ maxHeight: '60px' }} />
          </div>
          <h1>Farmácia Pinto</h1>
          <p>Registo de Faturas de Compra</p>
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

        <div className="login-footer">
          <p>© 2026 Farmácia Pinto. Todos os direitos reservados.</p>
        </div>
      </div>

      <style>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #4a3f83 0%, #2d9f6d 100%);
          padding: 20px;
        }

        .login-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
          width: 100%;
          max-width: 400px;
          padding: 40px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .logo-placeholder {
          width: 80px;
          height: 80px;
          background-color: #f5f5f5;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 12px;
          color: #999;
        }

        .logo-placeholder img {
          max-width: 100%;
          max-height: 100%;
        }

        .login-header h1 {
          font-size: 24px;
          margin-bottom: 8px;
          color: #4a3f83;
        }

        .login-header p {
          color: #666;
          font-size: 14px;
        }

        .login-footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #999;
          font-size: 12px;
        }

        .login-footer p {
          margin: 0;
        }
      `}</style>
    </div>
  );
};
