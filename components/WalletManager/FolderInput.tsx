'use client';

import { useState } from 'react';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { FolderOpen, Upload } from 'lucide-react';

interface FolderInputProps {
  onFilesSelected: (files: FileList) => void;
  acceptedTypes?: string;
  maxFiles?: number;
}

export function FolderInput({
  onFilesSelected,
  acceptedTypes = '.json,.txt',
  maxFiles = 100,
}: FolderInputProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          Import Wallets
        </CardTitle>
        <CardDescription>Upload wallet files or drag and drop them here</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <div className="space-y-2">
            <p className="text-lg font-medium">Drop files here</p>
            <p className="text-sm text-gray-500">or click to browse files</p>
            <p className="text-xs text-gray-400">Accepted formats: {acceptedTypes}</p>
            <p className="text-xs text-gray-400">Max files: {maxFiles}</p>
          </div>

          <div className="mt-4">
            <Label htmlFor="file-input" className="sr-only">
              Select files
            </Label>
            <Input
              id="file-input"
              type="file"
              multiple
              accept={acceptedTypes}
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              Select Files
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
