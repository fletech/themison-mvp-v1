import React from "react";

interface DocumentAIProps {
  trial: any;
}

export function DocumentAI({ trial }: DocumentAIProps) {
  return (
    <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Document AI for {trial.name}
        </h3>
        <p className="text-gray-500">
          AI-powered document analysis coming soon
        </p>
      </div>
    </div>
  );
}
