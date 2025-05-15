// components/chat/ClarificationHandler.tsx
"use client";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export interface ClarificationOption {
  id: string;
  text: string;
}

export interface ClarificationData {
  id: string; // Unique ID for this clarification request
  type: "SINGLE_QUESTION" | "MULTIPLE_CHOICE" | "FREE_TEXT";
  question_text: string;
  options?: ClarificationOption[]; // For MULTIPLE_CHOICE
  max_selections?: number; // For MULTIPLE_CHOICE, default 1 if not provided
}

interface ClarificationHandlerProps {
  clarificationData: ClarificationData;
  onSubmitClarification: (clarificationId: string, answers: any) => void;
  onCancelClarification?: () => void; // Optional: if user can cancel/skip
}

export default function ClarificationHandler({ clarificationData, onSubmitClarification, onCancelClarification }: ClarificationHandlerProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [freeTextAnswer, setFreeTextAnswer] = useState("");

  const handleOptionChange = (optionId: string) => {
    if (clarificationData.type === "MULTIPLE_CHOICE") {
      const maxSelections = clarificationData.max_selections || 1;
      setSelectedOptions(prev => {
        if (prev.includes(optionId)) {
          return prev.filter(id => id !== optionId);
        } else {
          if (prev.length < maxSelections) {
            return [...prev, optionId];
          } else if (maxSelections === 1) {
            return [optionId]; // Replace if only one selection allowed
          }
          return prev; // Max selections reached, don't add more
        }
      });
    }
  };

  const handleSubmit = () => {
    let answers;
    switch (clarificationData.type) {
      case "SINGLE_QUESTION": // Assuming this implies a yes/no or simple confirmation, or could be free text
      case "FREE_TEXT":
        answers = freeTextAnswer;
        break;
      case "MULTIPLE_CHOICE":
        answers = selectedOptions;
        break;
      default:
        console.error("Unknown clarification type:", clarificationData.type);
        return;
    }
    onSubmitClarification(clarificationData.id, answers);
  };

  return (
    <div className="p-4 border rounded-lg shadow-md bg-slate-50 my-4">
      <h3 className="text-lg font-semibold mb-3 text-slate-700">{clarificationData.question_text}</h3>
      
      {clarificationData.type === "MULTIPLE_CHOICE" && clarificationData.options && (
        <div className="space-y-2 mb-4">
          {clarificationData.options.map(option => (
            <div key={option.id} className="flex items-center space-x-2">
              {clarificationData.max_selections === 1 ? (
                <RadioGroup value={selectedOptions[0]} onValueChange={(value) => handleOptionChange(value)}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value={option.id} id={`clarify-option-${option.id}`} />
                        <Label htmlFor={`clarify-option-${option.id}`} className="font-normal">{option.text}</Label>
                    </div>
                </RadioGroup>
              ) : (
                <>
                  <Checkbox 
                    id={`clarify-option-${option.id}`}
                    checked={selectedOptions.includes(option.id)}
                    onCheckedChange={() => handleOptionChange(option.id)}
                  />
                  <Label htmlFor={`clarify-option-${option.id}`} className="font-normal">{option.text}</Label>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {(clarificationData.type === "SINGLE_QUESTION" || clarificationData.type === "FREE_TEXT") && (
        <Textarea 
          value={freeTextAnswer}
          onChange={(e) => setFreeTextAnswer(e.target.value)}
          placeholder="请输入您的回答..."
          className="mb-4"
          rows={3}
        />
      )}

      <div className="flex justify-end space-x-2">
        {onCancelClarification && (
            <Button variant="outline" onClick={onCancelClarification}>取消</Button>
        )}
        <Button onClick={handleSubmit} disabled={(clarificationData.type === "MULTIPLE_CHOICE" && selectedOptions.length === 0) || (clarificationData.type === "FREE_TEXT" && !freeTextAnswer.trim())}>
          提交回答
        </Button>
      </div>
    </div>
  );
}

