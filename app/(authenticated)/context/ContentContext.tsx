'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { DocumentFormat, VideoFormat } from '@/app/types';
import { useLocalStorage } from '@/app/(authenticated)/hooks/useLocalStorage';

interface ContentContextType {
  documents: DocumentFormat[];
  videos: VideoFormat[];
  addDocument: (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDocument: (id: string, document: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  addVideo: (video: Omit<VideoFormat, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateVideo: (id: string, video: Partial<VideoFormat>) => void;
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
  const [videos, setVideos] = useLocalStorage<VideoFormat[]>('videos', []);

  const generateId = () => Math.random().toString(36).substr(2, 9);
  const getCurrentTimestamp = () => new Date().toISOString();

  const addDocument = (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDocument: DocumentFormat = {
      ...document,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    setDocuments(prev => [...prev, newDocument]);
  };

  const updateDocument = (id: string, document: Partial<DocumentFormat>) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === id ? { ...doc, ...document, updatedAt: getCurrentTimestamp() } : doc
      )
    );
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const addVideo = (video: Omit<VideoFormat, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newVideo: VideoFormat = {
      ...video,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    setVideos(prev => [...prev, newVideo]);
  };

  const updateVideo = (id: string, video: Partial<VideoFormat>) => {
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