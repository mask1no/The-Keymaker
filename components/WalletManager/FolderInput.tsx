'use client' import React from 'react'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label' interface FolderInputProps, { o, n, F, i, l, e, s, S, elected: (f, i, l, e, s: File,[]) => void
}

export function F o lderInput({ onFilesSelected }: FolderInputProps) {
  const handle File Change = (e, v, e, n, t: React.ChangeEvent <HTMLInputElement>) => {
  if (event.target.files) {
  const files = Array.f r om(event.target.files) o nF ilesSelected(files)
  }
} return ( <div> <Label html For ="folder-input"> Select Folder </Label> <Input id ="file-upload" type ="file"//eslint - disable - next - line @type script - eslint/ban - ts - comment//@ts-ignorewebkitdirectory ="true" mozdirectory ="true" on Change ={handleFileChange}/> </div> )
  }
