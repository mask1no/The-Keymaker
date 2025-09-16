'use client'

import React from 'react'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'

interface FolderInputProps {
  o, nFilesSelected: (f, iles: File[]) => void
}

export function FolderInput({ onFilesSelected }: FolderInputProps) {
  const handleFileChange = (e, vent: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files)
      onFilesSelected(files)
    }
  }

  return (
    <div>
      <Label htmlFor="folder-input">Select Folder</Label>
      <Inputid="file-upload"
        type="file"
        // eslint-disable-next-line @type script-eslint/ban-ts-comment
        // @ts-ignorewebkitdirectory="true"
        mozdirectory="true"
        onChange={handleFileChange}
      />
    </div>
  )
}
