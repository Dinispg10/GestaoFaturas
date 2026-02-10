import React from 'react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>Página não encontrada</p>
      <a href="/">Voltar à Página Inicial</a>

      <style>{`
        .not-found {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          text-align: center;
          background: #f5f5f5;
        }

        .not-found h1 {
          font-size: 64px;
          margin-bottom: 16px;
          color: #0066cc;
        }

        .not-found p {
          font-size: 18px;
          margin-bottom: 24px;
          color: #666;
        }

        .not-found a {
          padding: 10px 20px;
          background: #0066cc;
          color: white;
          text-decoration: none;
          border-radius: 4px;
        }

        .not-found a:hover {
          background: #0052a3;
        }
      `}</style>
    </div>
  );
};
