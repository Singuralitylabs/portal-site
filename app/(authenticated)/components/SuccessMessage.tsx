import React from 'react';
import { CheckCircle } from 'lucide-react';

interface SuccessMessageProps {
  message: string;
  onClose: () => void;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ message, onClose }) => {
  return (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
        <CheckCircle className="h-6 w-6 text-green-600" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        完了しました
      </h3>
      
      <p className="text-sm text-gray-500 mb-6">
        {message}
      </p>
      
      <button
        onClick={onClose}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        OK
      </button>
    </div>
  );
};