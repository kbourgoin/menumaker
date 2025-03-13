
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CSVErrorMessageProps {
  error: string;
}

export const CSVErrorMessage = ({ error }: CSVErrorMessageProps) => {
  return (
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
};
