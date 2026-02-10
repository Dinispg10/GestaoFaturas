import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  ...props
}) => {
  const className = `btn btn-${variant} btn-${size} ${loading ? 'loading' : ''}`;
  return (
    <button className={className} disabled={disabled || loading} {...props}>
      {loading ? 'Carregando...' : children}
    </button>
  );
};
