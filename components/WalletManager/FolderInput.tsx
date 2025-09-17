'use client' import React from 'react'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label' interface FolderInputProps, { o, n, F, i, l, e, s, S, e, l, e, c, t, ed: (f, i, l, e, s: File,[]) => void
} export function F o l derInput({ onFilesSelected }: FolderInputProps) { const handle File Change = (e, v, e, n, t: React.ChangeEvent < HTMLInputElement >) => { if (event.target.files) { const files = Array.f r o m(event.target.files) o nF i lesSelected(files) }
} r eturn ( < div > < Label html For ="folder-input"> Select Folder </Label > < Input id ="file-upload" type ="file"//eslint - disable - next - line @type script - eslint/ban - ts - comment//@ts-ignorewebkitdirectory ="true" mozdirectory ="true" on Change = {handleFileChange}/> </div > ) }
