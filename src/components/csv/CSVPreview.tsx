
import React from "react";

interface CSVPreviewProps {
  previewData: string[][];
}

export const CSVPreview = ({ previewData }: CSVPreviewProps) => {
  return (
    <div className="border rounded p-3 text-sm space-y-1">
      <div className="font-medium mb-2">Preview:</div>
      {previewData.map((row, i) => (
        <div key={i} className="grid grid-cols-3 gap-2">
          {row.map((cell, j) => (
            <div key={j} className="truncate">
              {cell || <span className="text-muted-foreground italic">empty</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
