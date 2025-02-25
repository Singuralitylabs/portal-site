'use client';

import { Document } from '@/app/types';
import { FileText, FileType, Calendar, FileSpreadsheet } from 'lucide-react';
import { Button, Card, Flex, Text } from '@mantine/core';

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const getFileTypeIcon = (fileType: Document['fileType']) => {
    switch (fileType) {
      case 'pdf':
        return <FileText style={{width: '1.25rem', height: '1.25rem'}} />;
      case 'gsheet':
        return <FileSpreadsheet style={{width: '1.25rem', height: '1.25rem'}} />;
      default:
        return <FileType style={{width: '1.25rem', height: '1.25rem'}} />;
    }
  };

  return (
    <Card component="div" shadow="sm" padding="lg" radius="md" w="100%" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Flex gap="0.25rem" justify="flex-start" align="flex-start" direction="row">
          <div>{getFileTypeIcon(document.fileType)}</div>
          <div>{document.title}</div>
        </Flex>
      </Card.Section>
      <Card.Section>
        <Text component="div" p="1rem" h={(2 * 1.55 + 2) + 'rem'}>{document.description}</Text>
        <Flex gap="0.25rem" justify="flex-start" align="center" direction="row" p="0 1rem 1rem">
          <Calendar style={{width: '1rem', height: '1rem'}} />
          <Text component="div" fs="0.875rem" lh="1.25rem">{document.updatedAt}</Text>
          <Button component="div" radius="md" size="compact-sm" c="rgb(23,23,23)" bg="gray.2" fs="0.875rem" lh="1.25rem" ml="0.5rem">{document.category}</Button>
        </Flex>
        <Button color="#000" component="a" href={document.driveUrl} w={'100% - 2rem'} m="0 1rem 1rem" display="block" target="_blank" rel="noopener noreferrer">
          資料を開く
        </Button>
      </Card.Section>
    </Card>
  );
}