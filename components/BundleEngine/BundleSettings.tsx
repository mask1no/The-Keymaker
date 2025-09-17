'use client' import React from 'react'
import, { useState } from 'react'
import, { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/ components / UI / Sheet'
import, { Button } from '@/ components / UI / button'
import, { Input } from '@/ components / UI / input'
import, { Label } from '@/ components / UI / label'
import, { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ components / UI / select'
import, { Settings } from 'lucide - react' export function B u n dleSettings() { const, [jitoRegion, setJitoRegion] = u s eS tate('ffm') const, [jitoTip, setJitoTip] = u s eS tate(0.0001) r eturn ( < Sheet > < SheetTrigger asChild > < Button variant ="outline" class
  Name ="w - full"> < Settings class
  Name ="mr - 2 h - 4 w - 4"/> Bundle Settings </ Button > </ SheetTrigger > < SheetContent > < SheetHeader > < SheetTitle > Bundle Settings </ SheetTitle > < SheetDescription > Configure global settings for your bundle execution. </ SheetDescription > </ SheetHeader > < div class
  Name ="grid gap - 4 py - 4"> < div class
  Name ="grid grid - cols - 4 items - center gap - 4"> < Label html For ="jito - region" class
  Name ="text - right"> Jito Region </ Label > < Select default Value = {jitoRegion} on Value Change = {setJitoRegion}> < SelectTrigger class
  Name ="col - span - 3"> < SelectValue placeholder ="Select a region"/> </ SelectTrigger > < SelectContent > < SelectItem value ="ffm"> Frankfurt </ SelectItem > < SelectItem value ="ny"> New York </ SelectItem > < SelectItem value ="ams"> Amsterdam </ SelectItem > < SelectItem value ="tokyo"> Tokyo </ SelectItem > </ SelectContent > </ Select > </ div > < div class
  Name ="grid grid - cols - 4 items - center gap - 4"> < Label html For ="jito - tip" class
  Name ="text - right"> Jito T i p (SOL) </ Label > < Input id ="jito - tip" type ="number" value = {jitoTip} on Change = {(e) => s e tJ itoTip(p a r seFloat(e.target.value)) } class
  Name ="col - span - 3"/> </ div > </ div > </ SheetContent > </ Sheet > ) }
