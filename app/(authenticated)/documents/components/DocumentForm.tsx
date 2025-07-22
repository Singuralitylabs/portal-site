import React, { useState, useEffect } from 'react';
import { Document } from '@/app/types';
import { useContent } from '@/app/(authenticated)/context/ContentContext';

interface DocumentFormProps {
  document?: Document;
  onSuccess: () => void;
  onClose: () => void;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({ document, onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fileUrl: '',
  });

  const { addDocument, updateDocument } = useContent();
  const isEditing = !!document;

  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title,
        description: document.description,
        fileUrl: document.fileUrl,
      });
    }
  }, [document]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && document) {
      updateDocument(document.id, formData);
    } else {
      addDocument(formData);
    }
    
    onSuccess();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          タイトル
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="資料のタイトルを入力してください"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          説明
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="資料の説明を入力してください"
        />
      </div>

      <div>
        <label htmlFor="fileUrl" className="block text-sm font-medium text-gray-700 mb-2">
          ファイルURL
        </label>
        <input
          type="url"
          id="fileUrl"
          name="fileUrl"
          value={formData.fileUrl}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://example.com/document.pdf"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {isEditing ? '更新' : '作成'}
        </button>
      </div>
    </form>
  );
};