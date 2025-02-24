'use client';

import { Document } from '@/app/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, FileType, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const getFileTypeIcon = (fileType: Document['fileType']) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileType className="h-5 w-5" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getFileTypeIcon(document.fileType)}
            <CardTitle className="text-lg">{document.title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{document.description}</p>
        <div className="flex items-center gap-4 mb-4">
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {document.updatedAt}
          </span>
          <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm">
            {document.category}
          </span>
        </div>
        <Button asChild className="w-full">
          <a href={document.driveUrl} target="_blank" rel="noopener noreferrer">
            資料を開く
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}