
import React from "react";
import { Progress } from "@/components/ui/progress";

interface CSVImportProgressProps {
  progress: number;
}

export const CSVImportProgress = ({ progress }: CSVImportProgressProps) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Importing...</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};
