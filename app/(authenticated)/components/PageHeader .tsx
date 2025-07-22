import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from "@mantine/core";

interface PageHeaderProps {
  title: string;
  onCreateClick: () => void;
  createButtonText?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  onCreateClick, 
  createButtonText = "新規作成" 
}) => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '1.5rem' 
    }}>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <Button variant="subtle" onClick={onCreateClick} className="sm:hidden">
        <Plus className="h-4 w-4" />
        <span>{createButtonText}</span>
      </Button>
    </div>
  );
};