'use client';

import React, { useState, useEffect } from 'react';
import { CategoryType } from '@/app/types';
import { DocumentWithCategoryType } from '@/app/types/index';

import { useContent } from '@/app/(authenticated)/context/ContentContext';

interface DocumentFormProps {
  document?: DocumentWithCategoryType;
  categories: CategoryType[]; // 追加
  onSuccess: () => void;
  onClose: () => void;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({ document, categories, onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    fileUrl: '',
    owner: '',
  });

  const { addDocument, updateDocument } = useContent();
  const isEditing = !!document;

  useEffect(() => {
    if (document) {
      setFormData({
        name: document.name,
        category: typeof document.category === 'string'
          ? document.category
          : document.category?.name || '',
        description: document.description ?? '',
        url: document.url ?? '',
        asignee: document.asignee || '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          資料名
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
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          カテゴリー
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">選択してください</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          説明文
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
          資料URL
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

      <div>
        <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-2">
          担当者
        </label>
        <input
          type="text"
          id="owner"
          name="owner"
          value={formData.owner}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="担当者名を入力してください"
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