export interface Document {
  id: number;
  name: string;
  description: string;
  category: string;
  url: string;
  created_by: string;
  updated_by: string;
  assignee: string;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}