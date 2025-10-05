'use client';

import React from 'react';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';

interface FolderInputProps {
  o, n, F, ilesSelected: (f, i, l, es: File[]) => void;
}

export function FolderInput({ onFilesSelected }: FolderInputProps) {
  const handleFileChange = (e, v, e, nt: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      onFilesSelected(files);
    }
  };

  return (
    <div>
      <Label htmlFor="folder-input">Select Folder</Label>
      <Input
        id="folder-input"
        type="file"
        // @ts-ignore Folder selection flag for Chromium-based browsers
        webkitdirectory="true"
        // @ts-ignore Firefox folder selection flag
        mozdirectory="true"
        onChange={handleFileChange}
      />
    </div>
  );
}

