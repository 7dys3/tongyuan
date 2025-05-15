// components/chat/QuickActions.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Star, HelpCircle } from "lucide-react";
import { useState } from "react";

interface QuickAction {
  id: string;
  label: string;
  action: () => void;
  icon?: React.ReactNode;
}

interface QuickActionsProps {
  onSelectTemplate?: (templateText: string) => void;
  // Add more props for other quick actions like favorites
  userRole?: string; // Example: "客服", "合规"
}

// Placeholder templates - these would ideally come from a config or API based on role
const commonTemplates = [
  { id: "tpl1", text: "请问最新的存款利率是多少？", role: "客服" },
  { id: "tpl2", text: "如何办理信用卡挂失？", role: "客服" },
  { id: "tpl3", text: "查询账户余额。", role: "any" },
  { id: "tpl4", text: "请解释一下XX合规条款。", role: "合规" },
  { id: "tpl5", text: "近期是否有新的反洗钱政策更新？", role: "合规" },
];

export default function QuickActions({ onSelectTemplate, userRole = "any" }: QuickActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const availableTemplates = commonTemplates.filter(t => t.role === userRole || t.role === "any");

  const handleTemplateSelect = (templateText: string) => {
    if (onSelectTemplate) {
      onSelectTemplate(templateText);
    }
    setIsMenuOpen(false);
  };

  // Placeholder for favorite answers - this would need more complex state management
  const favoriteAnswers: QuickAction[] = [
    // { id: "fav1", label: "Favorite Answer 1...", action: () => console.log("Fav 1 clicked") },
  ];

  if (availableTemplates.length === 0 && favoriteAnswers.length === 0) {
    return null; // Don't show if no actions are available for the role
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          快捷操作 <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {availableTemplates.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center">
                <HelpCircle className="mr-2 h-4 w-4" /> 常用提问模板
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableTemplates.map((template) => (
              <DropdownMenuItem key={template.id} onClick={() => handleTemplateSelect(template.text)}>
                {template.text}
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        {/* Placeholder for Favorites - to be implemented more fully later */}
        {favoriteAnswers.length > 0 && (
          <>
            {availableTemplates.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="flex items-center">
                <Star className="mr-2 h-4 w-4" /> 我的收藏
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {favoriteAnswers.map((fav) => (
              <DropdownMenuItem key={fav.id} onClick={fav.action}>
                {fav.icon && <span className="mr-2">{fav.icon}</span>}
                {fav.label}
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        {/* Example of another action */} 
        {/* <DropdownMenuSeparator />
        <DropdownMenuItem>
          <MessageSquarePlus className="mr-2 h-4 w-4" /> 发起新会话
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

