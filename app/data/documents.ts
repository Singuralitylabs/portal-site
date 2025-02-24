import { Document } from '../types';

export const documents: Document[] = [
  {
    id: 1,
    name: 'プログラミング基礎講座 資料',
    description: 'プログラミングの基本概念と用語について解説した資料です。',
    category: 'プログラミング',
    url: 'https://drive.google.com/file/d/example1',
    created_by: '管理者',
    updated_by: '管理者',
    assignee: '管理者',
    is_deleted: false,
    created_at: new Date(2024,2,20), //'2024-03-20',
    updated_at: new Date(2024,2,20), //'2024-03-20',
  },
  {
    id: 2,
    name: 'デザインパターン解説',
    description: 'よく使用されるデザインパターンの解説と実装例',
    category: 'プログラミング',
    url: 'https://drive.google.com/file/d/example2',
    created_by: '管理者',
    updated_by: '管理者',
    assignee: '管理者',
    is_deleted: false,
    created_at: new Date(2024,2,18), //'2024-03-18'
    updated_at: new Date(2024,2,18), //'2024-03-18'
  },
  {
    id: 3,
    name: 'UI/UXデザインガイドライン',
    description: 'ユーザーインターフェースとユーザー体験の設計ガイドライン',
    category: 'デザイン',
    url: 'https://drive.google.com/file/d/example3',
    created_by: '管理者',
    updated_by: '管理者',
    assignee: '管理者',
    is_deleted: false,
    created_at: new Date(2024,2,15), //'2024-03-15'
    updated_at: new Date(2024,2,15), //'2024-03-15'
  },
];