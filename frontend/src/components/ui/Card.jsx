import React from 'react';

export const Card = ({ className, children }) => {
  return <div className={`border rounded-lg shadow-md p-4 ${className}`}>{children}</div>;
};

export const CardHeader = ({ children }) => {
  return <div className="mb-2 font-bold text-lg">{children}</div>;
};

export const CardTitle = ({ children }) => {
  return <h2 className="text-xl font-semibold">{children}</h2>;
};

export const CardDescription = ({ children }) => {
  return <p className="text-gray-600">{children}</p>;
};

export const CardContent = ({ children }) => {
  return <div className="mt-2">{children}</div>;
};
