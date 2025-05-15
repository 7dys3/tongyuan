
'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Or any other theme
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import apiService from '@/services/apiService'; // Import apiService

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  sources?: { source: string; content: string }[];
  isLoading?: boolean;
}

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  return !inline && match ? (
    <SyntaxHighlighter
      style={okaidia}
      language={match[1]}
      PreTag="div"
      {...props}
    >
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async () => {
    const userMessageText = inputValue.trim();
    if (!userMessageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString() + '-user',
      text: userMessageText,
      sender: 'user',
    };

    const loadingMessage: Message = {
        id: Date.now().toString() + '-loading',
        text: '思考中...',
        sender: 'agent',
        isLoading: true,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage, loadingMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Use apiService for the API call
      const response = await apiService.post('/query', { question: userMessageText });

      // Axios wraps the response data in a `data` object.
      const data = response.data;
      const agentResponse: Message = {
        id: loadingMessage.id,
        text: data.answer || '抱歉，我无法回答您的问题。',
        sender: 'agent',
        sources: data.sources || [],
        isLoading: false,
      };
      setMessages((prevMessages) =>
        prevMessages.map(msg =>
          msg.id === loadingMessage.id ? agentResponse : msg
        )
      );

    } catch (error: any) {
      console.error("API Error:", error);
      // Axios error handling: error.response?.data might contain the error details
      const errorMessage = error.response?.data?.detail || error.message || '连接服务器时发生错误';
      const errorResponse: Message = {
        id: loadingMessage.id,
        text: `抱歉，处理您的请求时发生错误: ${errorMessage}`,
        sender: 'agent',
        isLoading: false,
      };
      setMessages((prevMessages) =>
        prevMessages.map(msg =>
          msg.id === loadingMessage.id ? errorResponse : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
            scrollElement.scrollTop = scrollElement.scrollHeight;
        }
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-md p-4">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">金融 AI Agent</h1>
      </header>

      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end space-x-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'agent' && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-agent.jpg" alt="Agent" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow prose dark:prose-invert ${message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'}`}
              >
                {message.isLoading ? (
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    </div>
                ) : (
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            code: CodeBlock,
                        }}
                    >
                      {message.text}
                    </ReactMarkdown>
                )}
                {!message.isLoading && message.sender === 'agent' && message.sources && message.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                    <p className="text-xs font-semibold mb-1">来源:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {message.sources.map((source, index) => (
                        <li key={index} className="text-xs">
                          <span className="font-medium">{source.source}:</span> 
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]} 
                            components={{
                                code: CodeBlock,
                            }}
                          >
                            {source.content}
                          </ReactMarkdown>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {message.sender === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="输入您的问题..."
            className="flex-grow"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
            发送
          </Button>
        </div>
      </div>
    </div>
  );
}

