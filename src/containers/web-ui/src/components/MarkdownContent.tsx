'use dom';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownContentProps {
  content: string;
  isUser?: boolean;
  isSystem?: boolean;
}

export default function MarkdownContent({ content, isUser = false, isSystem = false }: MarkdownContentProps) {
  // Web専用のスタイル
  const markdownStyles = `
    .markdown-content {
      font-size: 16px;
      line-height: 1.5;
      overflow-wrap: break-word;
      color: ${isUser ? '#fff' : '#000'};
    }
    
    .markdown-content pre {
      background-color: ${isUser ? 'rgba(255,255,255,0.1)' : '#f6f8fa'};
      border-radius: 6px;
      padding: 16px;
      overflow: auto;
      margin: 8px 0;
    }
    
    .markdown-content code {
      background-color: ${isUser ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.9em;
      padding: 2px 4px;
    }
    
    .markdown-content a {
      color: ${isUser ? '#d0e0ff' : '#0366d6'};
      text-decoration: underline;
    }
    
    .markdown-content blockquote {
      border-left: 4px solid #dfe2e5;
      padding-left: 16px;
      color: #6a737d;
      margin: 8px 0;
    }
    
    .markdown-content ul, 
    .markdown-content ol {
      margin-left: 20px;
    }
    
    .markdown-content table {
      border-collapse: collapse;
      width: 100%;
      margin: 12px 0;
    }
    
    .markdown-content table th,
    .markdown-content table td {
      border: 1px solid #dfe2e5;
      padding: 6px 12px;
      text-align: left;
    }
    
    .markdown-content table th {
      background-color: #f6f8fa;
    }
    
    ${isSystem ? `
    /* システムメッセージ用のスタイル（思考中など） */
    .markdown-content.system-msg {
      font-style: italic;
      color: #0066cc;
    }
    ` : ''}
  `;

  return (
    <div style={{ width: '100%' }} data-expo-match-contents>
      <style>{markdownStyles}</style>
      <div className={`markdown-content ${isSystem ? 'system-msg' : ''} ${isUser ? 'user-msg' : ''}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
} 