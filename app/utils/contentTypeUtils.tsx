import { ContentType } from '@/app/types';

/**
 * コンテンツタイプから日本語名を取得する
 */
export function getContentTypeName(contentType: ContentType): string {
  switch (contentType) {
    case 'document':
      return '資料';
    case 'video':
      return '動画';
    default:
      // TypeScriptの網羅性チェックのため
      const _exhaustiveCheck: never = contentType;
      throw new Error(`Unknown content type: ${_exhaustiveCheck}`);
  }
}

/**
 * コンテンツタイプから操作メッセージを生成する
 */
export function getOperationMessage(contentType: ContentType, operation: 'create' | 'edit' | 'delete' | 'success'): string {
  const typeName = getContentTypeName(contentType);
  
  switch (operation) {
    case 'create':
      return `${typeName}を新規作成`;
    case 'edit':
      return `${typeName}を編集`;
    case 'delete':
      return `${typeName}を削除`;
    case 'success':
      return `${typeName}の操作が完了しました。`;
    default:
      const _exhaustiveCheck: never = operation;
      throw new Error(`Unknown operation: ${_exhaustiveCheck}`);
  }
}