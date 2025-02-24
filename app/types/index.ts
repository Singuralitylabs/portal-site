export interface Document {
  id: string;
  title: string;
  description: string;
  category: string;
  driveUrl: string;
  fileType: 'pdf' | 'doc' | 'xls' | 'ppt' | 'other';
  updatedAt: string;
}