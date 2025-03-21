
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SourceFormData {
  name: string;
  type: 'book' | 'website';
  description: string;
}

interface SourceFormFieldsProps {
  formData: SourceFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleTypeChange: (value: string) => void;
}

const SourceFormFields: React.FC<SourceFormFieldsProps> = ({
  formData,
  handleInputChange,
  handleTypeChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="edit-name" className="text-sm font-medium">
          Name <span className="text-red-500">*</span>
        </label>
        <Input
          id="edit-name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="edit-type" className="text-sm font-medium">
          Type <span className="text-red-500">*</span>
        </label>
        <Select
          value={formData.type}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger id="edit-type">
            <SelectValue placeholder="Select source type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="book">Book</SelectItem>
            <SelectItem value="website">Website</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="edit-description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="edit-description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
        />
      </div>
    </div>
  );
};

export default SourceFormFields;
