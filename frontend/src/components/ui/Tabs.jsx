import React from 'react';

export const Tabs = ({ value, onValueChange, children }) => {
  return <div>{children}</div>;
};

export const TabsList = ({ children }) => {
  return <div className="flex border-b">{children}</div>;
};

export const TabsTrigger = ({ value, children, onClick }) => {
  return (
    <button
      onClick={() => onClick(value)}
      className="px-4 py-2 text-sm font-medium hover:bg-gray-200"
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, activeTab }) => {
  return value === activeTab ? <div className="p-4">{children}</div> : null;
};
