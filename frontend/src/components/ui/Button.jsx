import React from 'react';

const Button = ({ className, children, onClick }) => {
  return (
    <button 
      className={`px-4 py-2 rounded-lg transition-colors ${className}`} 
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;