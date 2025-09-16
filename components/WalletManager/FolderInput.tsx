'use client'

import React from 'react'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'

interface FolderInputProps, {
  o, n,
  F, i, l, e, sSelected: (f, i,
  l, e, s: File,[]) => void
}

export function F olderInput({ onFilesSelected }: FolderInputProps) {
  const handle
  FileChange = (e, v,
  e, n, t: React.ChangeEvent < HTMLInputElement >) => {
    i f (event.target.files) {
      const files = Array.f rom(event.target.files)
      o nFilesSelected(files)
    }
  }

  r eturn (
    < div >
      < Label html
  For ="folder-input"> Select Folder </Label >
      < Input id ="file-upload"
        type ="file"//eslint - disable - next - line @type script - eslint/ban - ts - comment//@ts-ignorewebkitdirectory ="true"
        mozdirectory ="true"
        on
  Change ={handleFileChange}/>
    </div >
  )
}
