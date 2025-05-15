// components/chat/ChatArea.tsx (Updating Source Handling and Display for Generated Images)
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Paperclip, Send, User, Bot, ChevronDown, FileText as FileTextIcon, DatabaseZap as TushareIcon, Globe as WebIcon, Image as ImageIcon, ThumbsUp, ThumbsDown } from "lucide-react"; // Added ImageIcon, ThumbsUp, ThumbsDown
import { apiService } from "@/services/apiService";
import ClarificationHandler, { ClarificationData } from "./ClarificationHandler";
import QuickActions from "./QuickActions";
import { v4 as uuidv4 } from "uuid";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { Badge } from "@/components/ui/badge"; // For source type badge (Removed as unused)

// Define more specific source types based on backend schemas/query.py
interface BaseSource {
  type: string;
  id?: string;
  name?: string; // General name or title for the source
  tool_name?: string; // Tool that generated this source
}

interface DocumentSource extends BaseSource {
  type: "document";
  document_id: string;
  document_name: string;
  chunk_id: string;
  page_number?: number;
  content_preview?: string;
  score?: number;
}

interface WebSource extends BaseSource {
  type: "web";
  url: string;
  title?: string;
  snippet?: string;
}

interface TushareSource extends BaseSource {
  type: "tushare_query";
  api_name: string;
  params: Record<string, any>;
  result_summary?: string;
}

interface GeneratedImageSource extends BaseSource {
  type: "generated_image";
  title?: string; // Title or description of the image
  content_base64: string; // Base64 encoded image data
  metadata?: Record<string, any>; // e.g., { analysis_type: "line_plot" }
}

type AnySource = DocumentSource | WebSource | TushareSource | GeneratedImageSource;

interface MessageFeedback {
  rating: "like" | "dislike" | null;
  text?: string;
  submitted: boolean;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  sources?: AnySource[]; 
  clarification_data?: ClarificationData | null;
  original_query_for_clarification?: string;
  feedback?: MessageFeedback;
  query_id?: string;
}

export default function ChatArea() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentClarification, setCurrentClarification] = useState<ClarificationData | null>(null);
  const [queryAwaitingClarification, setQueryAwaitingClarification] = useState<string | null>(null);
  const [showFeedbackInputFor, setShowFeedbackInputFor] = useState<string | null>(null);
  const [currentFeedbackText, setCurrentFeedbackText] = useState("");

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector("div[data-radix-scroll-area-viewport]");
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim() && !currentClarification) return;
    const currentQueryId = uuidv4();

    const userMessage: Message = {
      id: uuidv4(),
      text: textToSend,
      sender: "user",
      timestamp: new Date(),
      query_id: currentQueryId,
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await apiService.post<any>("/api/v2/query/agent", {
        query: textToSend,
        query_id: currentQueryId,
        // dialogue_history: messages.filter(m => m.sender === "user" || m.sender === "bot").slice(-10).map(m => ({role: m.sender, content: m.text})) // More robust history
      });

      const botMessage: Message = {
        id: uuidv4(),
        text: response.answer || "Sorry, I could not understand that.",
        sender: "bot",
        timestamp: new Date(),
        sources: response.sources || [],
        clarification_data: response.clarification_data || null,
        feedback: { rating: null, submitted: false },
        query_id: currentQueryId,
      };

      setMessages(prev => [...prev, botMessage]);

      if (response.clarification_data) {
        setCurrentClarification(response.clarification_data);
        setQueryAwaitingClarification(textToSend);
      } else {
        setCurrentClarification(null);
        setQueryAwaitingClarification(null);
      }

    } catch (error: any) {
      const errorMessage: Message = {
        id: uuidv4(),
        text: error.response?.data?.detail || error.message || "An error occurred while fetching the response.",
        sender: "bot",
        timestamp: new Date(),
        feedback: { rating: null, submitted: false },
        query_id: currentQueryId,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitClarification = async (clarificationId: string, answers: any) => {
    if (!queryAwaitingClarification) {
        console.error("Original query for clarification is missing.");
        return;
    }
    const originalQueryMessage = messages.find(m => m.text === queryAwaitingClarification && m.sender === "user");
    const currentQueryId = originalQueryMessage?.query_id || uuidv4();

    setIsLoading(true);
    setCurrentClarification(null);

    const clarificationResponseMessage: Message = {
        id: uuidv4(),
        text: `(Clarification provided: ${typeof answers === "string" ? answers : JSON.stringify(answers)})`,
        sender: "user",
        timestamp: new Date(),
        query_id: currentQueryId,
    };
    setMessages(prev => [...prev, clarificationResponseMessage]);

    try {
        const response = await apiService.post<any>("/api/v2/query/clarify", {
            original_query: queryAwaitingClarification,
            clarification_id: clarificationId,
            answers: answers,
            query_id: currentQueryId,
        });

        const botMessage: Message = {
            id: uuidv4(),
            text: response.answer || "Thank you for the clarification. Here is the updated response.",
            sender: "bot",
            timestamp: new Date(),
            sources: response.sources || [],
            clarification_data: response.clarification_data || null,
            feedback: { rating: null, submitted: false },
            query_id: currentQueryId,
        };
        setMessages(prev => [...prev, botMessage]);

        if (response.clarification_data) {
            setCurrentClarification(response.clarification_data);
        } else {
            setQueryAwaitingClarification(null);
        }

    } catch (error: any) {
        const errorMessage: Message = {
            id: uuidv4(),
            text: error.response?.data?.detail || error.message || "An error occurred while submitting the clarification.",
            sender: "bot",
            timestamp: new Date(),
            feedback: { rating: null, submitted: false },
            query_id: currentQueryId,
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, rating: "like" | "dislike", feedbackText?: string) => {
    setMessages(prevMessages => prevMessages.map(msg =>
      msg.id === messageId ? { ...msg, feedback: { rating, text: feedbackText, submitted: true } } : msg
    ));
    setShowFeedbackInputFor(null);
    setCurrentFeedbackText("");

    const messageToFeedback = messages.find(msg => msg.id === messageId);

    try {
      await apiService.post("/api/v2/feedback", {
        message_id: messageId,
        query_id: messageToFeedback?.query_id,
        rating: rating,
        text: feedbackText,
        user_id: "current_user_id", 
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      setMessages(prevMessages => prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, feedback: { ...msg.feedback!, submitted: false } } : msg
      ));
    }
  };

  const handleDislikeClick = (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message && message.feedback && !message.feedback.submitted) {
        if (showFeedbackInputFor === messageId) {
            handleFeedback(messageId, "dislike", currentFeedbackText || undefined);
        } else {
            setShowFeedbackInputFor(messageId);
        }
    }
  };

  const handleLikeClick = (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message && message.feedback && !message.feedback.submitted) {
        handleFeedback(messageId, "like");
    }
  };

  const handleCancelClarification = () => {
    setCurrentClarification(null);
    setQueryAwaitingClarification(null);
    const cancelMessage: Message = {
        id: uuidv4(),
        text: "(Clarification cancelled by user)",
        sender: "user",
        timestamp: new Date(),
    };
    setMessages(prev => [...prev, cancelMessage]);
  };

  const handleQuickActionSelect = (templateText: string) => {
    setInputMessage(templateText);
  };

  const renderSource = (source: AnySource, index: number) => {
    const key = `${source.type}-${source.id || source.name || index}`;
    switch (source.type) {
      case "document":
        const docSource = source as DocumentSource;
        return (
          <li key={key} className="text-xs text-slate-600 flex items-start">
            <FileTextIcon className="h-4 w-4 mr-1.5 text-slate-400 shrink-0 mt-0.5" />
            <Popover>
              <PopoverTrigger asChild>
                <span className="truncate hover:underline cursor-pointer" title={docSource.document_name}>
                  {docSource.document_name} (p. {docSource.page_number || "N/A"})
                </span>
              </PopoverTrigger>
              <PopoverContent className="w-80 text-sm">
                <div className="font-semibold mb-1">{docSource.document_name}</div>
                <div className="text-xs text-gray-500 mb-2">
                  Page: {docSource.page_number || "N/A"} | Chunk ID: {docSource.chunk_id} | Score: {docSource.score?.toFixed(2) ?? "N/A"}
                </div>
                <p className="max-h-40 overflow-y-auto text-xs bg-slate-50 p-2 rounded">
                  {docSource.content_preview}
                </p>
              </PopoverContent>
            </Popover>
          </li>
        );
      case "web":
        const webSource = source as WebSource;
        return (
          <li key={key} className="text-xs text-slate-600 flex items-start">
            <WebIcon className="h-4 w-4 mr-1.5 text-slate-400 shrink-0 mt-0.5" />
            <a href={webSource.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline" title={webSource.title || webSource.url}>
              {webSource.title || webSource.url}
            </a>
          </li>
        );
      case "tushare_query":
        const tushareSource = source as TushareSource;
        return (
          <li key={key} className="text-xs text-slate-600 flex items-start">
            <TushareIcon className="h-4 w-4 mr-1.5 text-slate-400 shrink-0 mt-0.5" />
            <Popover>
              <PopoverTrigger asChild>
                <span className="truncate hover:underline cursor-pointer" title={`Tushare API: ${tushareSource.api_name}`}>
                  Tushare: {tushareSource.api_name}
                </span>
              </PopoverTrigger>
              <PopoverContent className="w-96 text-sm">
                <div className="font-semibold mb-1">Tushare API Call: {tushareSource.api_name}</div>
                <div className="text-xs text-gray-500 mb-2">Parameters:</div>
                <pre className="max-h-32 overflow-y-auto text-xs bg-slate-50 p-2 rounded mb-2">
                  {JSON.stringify(tushareSource.params, null, 2)}
                </pre>
                {tushareSource.result_summary && (
                    <p className="text-xs bg-slate-100 p-2 rounded">
                        Summary: {tushareSource.result_summary}
                    </p>
                )}
              </PopoverContent>
            </Popover>
          </li>
        );
      case "generated_image":
        const imgSource = source as GeneratedImageSource;
        return (
          <li key={key} className="text-xs text-slate-600 flex flex-col items-start">
            <div className="flex items-center mb-1">
                <ImageIcon className="h-4 w-4 mr-1.5 text-slate-400 shrink-0" />
                <span className="truncate" title={imgSource.title || "Generated Image"}>
                {imgSource.title || "Generated Image"} (from {imgSource.tool_name || "Data Analysis Tool"})
                </span>
            </div>
            <img 
                src={`data:image/png;base64,${imgSource.content_base64}`}
                alt={imgSource.title || "Generated chart"} 
                className="max-w-full h-auto rounded border border-slate-200 shadow-sm mt-1"
            />
            {imgSource.metadata && Object.keys(imgSource.metadata).length > 0 && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="link" size="sm" className="text-xs p-0 h-auto mt-1 text-slate-500 hover:text-slate-700">
                            View Details <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 text-sm">
                        <div className="font-semibold mb-1">Image Details</div>
                        <pre className="max-h-32 overflow-y-auto text-xs bg-slate-50 p-2 rounded">
                            {JSON.stringify(imgSource.metadata, null, 2)}
                        </pre>
                    </PopoverContent>
                </Popover>
            )}
          </li>
        );
      default:
        return (
            <li key={`unknown-${index}`} className="text-xs text-red-500">
                Unknown source type: {(source as any).type}
            </li>
        );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-slate-100 rounded-lg shadow-lg">
      <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} mb-1`}>
            <div className={`p-3 rounded-lg max-w-[70%] ${msg.sender === "user" ? "bg-blue-500 text-white" : "bg-white text-slate-800 shadow-sm"}`}>
              <div className="prose prose-sm max-w-none">
                <Markdown remarkPlugins={[remarkGfm]}>{msg.text}</Markdown>
              </div>
              <div className={`text-xs mt-1 flex justify-between items-center ${msg.sender === "user" ? "text-blue-200" : "text-slate-400"}`}>
                <span>
                  {msg.timestamp.toLocaleTimeString()} {msg.sender === "bot" && <Bot className="inline h-3 w-3 ml-1" />}
                  {msg.sender === "user" && <User className="inline h-3 w-3 ml-1" />}
                </span>
              </div>
              {msg.sender === "bot" && (
                <div className="mt-2">
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <h4 className="text-xs font-semibold mb-1 text-slate-500">Sources:</h4>
                      <ul className="space-y-2">
                        {msg.sources.map((source, index) => renderSource(source, index))}
                      </ul>
                    </div>
                  )}
                  {msg.feedback && !msg.feedback.submitted && (
                    <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-slate-200">
                      <Button variant="ghost" size="icon" onClick={() => handleLikeClick(msg.id)} title="Like this answer">
                        <ThumbsUp className={`h-4 w-4 ${msg.feedback.rating === "like" ? "text-green-500" : "text-slate-500"}`} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDislikeClick(msg.id)} title="Dislike this answer">
                        <ThumbsDown className={`h-4 w-4 ${msg.feedback.rating === "dislike" ? "text-red-500" : "text-slate-500"}`} />
                      </Button>
                    </div>
                  )}
                  {msg.feedback && msg.feedback.submitted && (
                     <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">Feedback submitted. Thank you!</p>
                  )}
                  {showFeedbackInputFor === msg.id && msg.feedback && !msg.feedback.submitted && (
                    <div className="mt-2 space-y-1">
                        <Textarea 
                            placeholder="Provide additional feedback (optional)"
                            value={currentFeedbackText}
                            onChange={(e) => setCurrentFeedbackText(e.target.value)}
                            className="text-sm"
                            rows={2}
                        />
                        <Button size="sm" onClick={() => handleFeedback(msg.id, "dislike", currentFeedbackText || undefined)}>
                            Submit Feedback
                        </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start mb-1">
            <div className="p-3 rounded-lg bg-white text-slate-800 shadow-sm animate-pulse">
              Bot is typing...
            </div>
          </div>
        )}
        {currentClarification && (
          <ClarificationHandler              clarificationData={currentClarification}
            onSubmitClarification={handleSubmitClarification}
            onCancelClarification={handleCancelClarification}
          />
        )}
      </ScrollArea>
      {!currentClarification && (
        <>
        <QuickActions onSelectTemplate={handleQuickActionSelect} />
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" className="shrink-0">
              <Paperclip className="h-4 w-4" />
              <span className="sr-only">Attach file</span>
            </Button>
            <Input
              type="text"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
              className="flex-grow"
              disabled={isLoading}
            />
            <Button onClick={() => handleSendMessage()} disabled={isLoading || !inputMessage.trim()}>
              <Send className="h-4 w-4 mr-2" /> Send
            </Button>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

