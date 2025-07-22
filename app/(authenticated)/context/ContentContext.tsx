import React, { createContext, useContext, ReactNode } from 'react';
import { Document, Video } from '@/app/types';
import { useLocalStorage } from '@/app/(authenticated)/hooks/useLocalStorage';

interface ContentContextType {
  documents: Document[];
  videos: Video[];
  addDocument: (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDocument: (id: string, document: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  addVideo: (video: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateVideo: (id: string, video: Partial<Video>) => void;
  deleteVideo: (id: string) => void;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

interface ContentProviderProps {
  children: ReactNode;
}

export const ContentProvider: React.FC<ContentProviderProps> = ({ children }) => {
  const [documents, setDocuments] = useLocalStorage<Document[]>('documents', []);
  const [videos, setVideos] = useLocalStorage<Video[]>('videos', []);

  const generateId = () => Math.random().toString(36).substr(2, 9);
  const getCurrentTimestamp = () => new Date().toISOString();

  const addDocument = (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDocument: Document = {
      ...document,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    setDocuments(prev => [...prev, newDocument]);
  };

  const updateDocument = (id: string, document: Partial<Document>) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === id ? { ...doc, ...document, updatedAt: getCurrentTimestamp() } : doc
      )
    );
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const addVideo = (video: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newVideo: Video = {
      ...video,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    setVideos(prev => [...prev, newVideo]);
  };

  const updateVideo = (id: string, video: Partial<Video>) => {
    setVideos(prev =>
      prev.map(vid =>
        vid.id === id ? { ...vid, ...video, updatedAt: getCurrentTimestamp() } : vid
      )
    );
  };

  const deleteVideo = (id: string) => {
    setVideos(prev => prev.filter(vid => vid.id !== id));
  };

  return (
    <ContentContext.Provider
      value={{
        documents,
        videos,
        addDocument,
        updateDocument,
        deleteDocument,
        addVideo,
        updateVideo,
        deleteVideo,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};