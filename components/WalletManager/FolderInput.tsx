'use client'

import React from 'react'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'

interface FolderInputProps {
  onFilesSelected: (files: File[]) => void
}

export function FolderInput({ onFilesSelected }: FolderInputProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files)
      onFilesSelected(files)
    }
  }

  return (
    <div>
      <Label htmlFor="folder-input">Select Folder</Label>
      <Input
        id="folder-input"
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        mozdirectory="true"
        onChange={handleFileChange}
      />
    </div>
  )
}
