import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Document, Video } from '@/app/types';
import { getContentTypeName } from '@/app/utils/contentTypeUtils';

interface DeleteConfirmationProps {
  item: Document | Video;
  contentType: 'document' | 'video';
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  item,
  contentType,
  onConfirm,
  onCancel,
}) => {
  const typeName = getContentTypeName(contentType);

  return (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {typeName}を削除しますか？
      </h3>
      
      <p className="text-sm text-gray-500 mb-6">
        「{item.title}」を削除します。この操作は取り消すことができません。
      </p>
      
      <div className="flex justify-center space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          削除
        </button>
      </div>
    </div>
  );
};