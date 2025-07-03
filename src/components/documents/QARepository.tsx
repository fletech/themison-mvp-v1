import React from "react";

interface QARepositoryProps {
  trial: any;
}

export function QARepository({ trial }: QARepositoryProps) {
  return (
    <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          QA Repository for {trial.name}
        </h3>
        <p className="text-gray-500">
          Quality assurance and document review repository coming soon
        </p>
      </div>
    </div>
  );
}
