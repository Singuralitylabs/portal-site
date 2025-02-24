import { Document } from '../types';

export const documents: Document[] = [
  {
    id: '1',
    title: 'プログラミング基礎講座 資料',
    description: 'プログラミングの基本概念と用語について解説した資料です。',
    category: 'プログラミング',
    driveUrl: 'https://drive.google.com/file/d/example1',
    fileType: 'pdf',
    updatedAt: '2024-03-20',
  },
  {
    id: '2',
    title: 'デザインパターン解説',
    description: 'よく使用されるデザインパターンの解説と実装例',
    category: 'プログラミング',
    driveUrl: 'https://drive.google.com/file/d/example2',
    fileType: 'pdf',
    updatedAt: '2024-03-18',
  },
  {
    id: '3',
    title: 'UI/UXデザインガイドライン',
    description: 'ユーザーインターフェースとユーザー体験の設計ガイドライン',
    category: 'デザイン',
    driveUrl: 'https://drive.google.com/file/d/example3',
    fileType: 'pdf',
    updatedAt: '2024-03-15',
  },
];