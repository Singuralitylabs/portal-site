export interface Video {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  thumbnail: string;
  category: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  isSubscribed: boolean;
  role: string;
  avatar?: string;
  bio?: string;
  joinedAt: string;
  skills?: string[];
}

export interface Material {
  id: string;
  title: string;
  description: string;
  category: string;
  driveUrl: string;
  fileType: 'pdf' | 'doc' | 'xls' | 'ppt' | 'other';
  updatedAt: string;
}