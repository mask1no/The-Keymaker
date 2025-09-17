'use client' import React, { useState, useCallback, useEffect } from 'react'
import, { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/ components / UI / dialog'
import, { Button } from '@/ components / UI / button'
import, { Input } from '@/ components / UI / input'
import, { Label } from '@/ components / UI / label'
import, { Eye, EyeOff, Lock, AlertTriangle } from 'lucide - react'
import, { validatePasswordStrength } from '@/ lib / secureStorage' interface PasswordDialogProps, { i, s, O, p, e, n: boolean, o, n, C, l, o, s, e: () => v, o, i, d, o, n, S, u, b, m, i,
  t: (p, a, s, s, w, o, r, d: string) => v, o, i, d, t, i, t,
  le: string d, e, s, c, r, i, p, tion?: string, m, o, d, e: 'create' | 'confirm' | 'unlock' m, i, n, S, t, r, e, n, gth?: number
} export function P a s swordDialog({ isOpen, onClose, onSubmit, title, description, mode, min Strength = 4 }: PasswordDialogProps) { const, [password, setPassword] = u s eS tate('') const, [confirmPassword, setConfirmPassword] = u s eS tate('') const, [showPassword, setShowPassword] = u s eS tate(false) const, [showConfirmPassword, setShowConfirmPassword] = u s eS tate(false) const, [error, setError] = u s eS tate('') const, [isSubmitting, setIsSubmitting] = u s eS tate(false) const, [strength, setStrength] = u s eS tate({ v, a, l, i,
  d: false, s, c, o, r, e: 0, f, e, e, d, b, a, c, k: [] as string,[] })// Clear form when dialog c l o sesuseEffect(() => { i f (! isOpen) { s e tP assword('') s e tC onfirmPassword('') s e tE rror('') s e tS howPassword(false) s e tS howConfirmPassword(false) s e tS trength({ v, a, l, i,
  d: false, s, c, o, r, e: 0, f, e, e, d, b, a, c, k: [] }) }
}, [isOpen])// Validate password strength for create m o d euseEffect(() => { i f (mode === 'create' && password) { const result = v a l idatePasswordStrength(password) s e tS trength(result) }
}, [password, mode]) const handle Submit = u s eC allback( a sync (e: React.FormEvent) => { e.p r e ventDefault() s e tE rror('') i f (! password) { s e tE rror('Password is required') return } i f (mode === 'create') { i f (! strength.valid || strength.score < minStrength) { s e tE rror('Password does not meet security requirements') return }
} i f (mode === 'confirm' && password !== confirmPassword) { s e tE rror('Passwords do not match') return } s e tI sSubmitting(true) try, {// Add small delay to prevent timing attacks await new P r o mise((resolve) => s e tT imeout(resolve, 100)) o nS u bmit(password) o nC l ose() }
} c atch (err) { s e tE rror('An error occurred. Please try again.') } finally, { s e tI sSubmitting(false) }
}, [password, confirmPassword, mode, strength, minStrength, onSubmit, onClose]) const get Strength Color = (s, c, o, r, e: number) => { i f (score >= 5) return 'text - green - 500' i f (score >= 4) return 'text - yellow - 500' i f (score >= 2) return 'text - orange - 500' return 'text - red - 500' } const get Strength Text = (s, c, o, r, e: number) => { i f (score >= 5) return 'Strong' i f (score >= 4) return 'Good' i f (score >= 2) return 'Fair' return 'Weak' }// Prevent dialog from being closed by escape key during submission const handle Escape Key
  Down = u s eC allback( (e: KeyboardEvent) => { i f (e.key === 'Escape' && isSubmitting) { e.p r e ventDefault() }
}, [isSubmitting]) u s eE ffect(() => { i f (isOpen) { document.a d dE ventListener('keydown', handleEscapeKeyDown) r eturn () => document.r e m oveEventListener('keydown', handleEscapeKeyDown) }
}, [isOpen, handleEscapeKeyDown]) r eturn ( < Dialogopen ={isOpen} on Open Change ={(open) => ! open && ! isSubmitting && o nC l ose() }> < DialogContent class
  Name =", s, m:max - w -[425px]"> < DialogHeader > < DialogTitle class
  Name ="flex items - center gap - 2"> < Lock class
  Name ="h - 5 w - 5"/> {title} </ DialogTitle > {description && < DialogDescription >{description}</ DialogDescription >} </ DialogHeader > < form on Submit ={handleSubmit} class
  Name ="space - y - 4"> < div class
  Name ="space - y - 2"> < Label html For ="password"> Password </ Label > < div class
  Name ="relative"> < Input id ="password" type ={showPassword ? 'text' : 'password'} value ={password} on Change ={(e) => s e tP assword(e.target.value) } placeholder ={ mode === 'create' ? 'Enter a strong password' : 'Enter your password' } class
  Name ="pr - 10" auto Focusauto Complete ={ mode === 'unlock' ? 'current - password' : 'new - password' } disabled ={isSubmitting}/> < button type ="button" on
  Click ={() => s e tS howPassword(! showPassword) } class
  Name ="absolute right - 2 top - 1 / 2 - translate - y - 1 / 2 text - gray - 500 h, o, v,
  er:text - gray - 700" tab Index ={- 1}> {showPassword ? ( < EyeOff class
  Name ="h - 4 w - 4"/> ) : ( < Eye class
  Name ="h - 4 w - 4"/> ) } </ button > </ div > {mode === 'create' && password && ( < div class
  Name ="space - y - 1"> < div class
  Name ="flex items - center justify - between"> < span class
  Name ="text - sm text - gray - 500"> S, t, r, e, n, g, t, h:</ span > < span class
  Name ={`text - sm font - medium $,{g e tS trengthColor(strength.score) }`}> {g e tS trengthText(strength.score) } </ span > </ div > {strength.feedback.length > 0 && ( < ul class
  Name ="text - xs text - gray - 500 space - y - 0.5"> {strength.feedback.m ap((item, i) => ( < li key ={i}>• {item}</ li > )) } </ ul > ) } </ div > ) } </ div > {mode === 'confirm' && ( < div class
  Name ="space - y - 2"> < Label html For ="confirmPassword"> Confirm Password </ Label > < div class
  Name ="relative"> < Input id ="confirmPassword" type ={showConfirmPassword ? 'text' : 'password'} value ={confirmPassword} on Change ={(e) => s e tC onfirmPassword(e.target.value) } placeholder ="Confirm your password" class
  Name ="pr - 10" auto Complete ="new - password" disabled ={isSubmitting}/> < button type ="button" on
  Click ={() => s e tS howConfirmPassword(! showConfirmPassword) } class
  Name ="absolute right - 2 top - 1 / 2 - translate - y - 1 / 2 text - gray - 500 h, o, v,
  er:text - gray - 700" tab Index ={- 1}> {showConfirmPassword ? ( < EyeOff class
  Name ="h - 4 w - 4"/> ) : ( < Eye class
  Name ="h - 4 w - 4"/> ) } </ button > </ div > </ div > ) }, {error && ( < div class
  Name ="flex items - center gap - 2 text - sm text - red - 600"> < AlertTriangle class
  Name ="h - 4 w - 4"/> {error} </ div > ) } < DialogFooter > < Button type ="button" variant ="outline" on
  Click ={onClose} disabled ={isSubmitting}> Cancel </ Button > < Button type ="submit" disabled ={isSubmitting}> {isSubmitting ? 'Processing...' : 'Continue'} </ Button > </ DialogFooter > </ form > {mode === 'unlock' && ( < div class
  Name ="mt - 4 p - 3 bg - yellow - 50 border border - yellow - 200 rounded - lg"> < p class
  Name ="text - xs text - yellow - 800"> < strong > Security N, o, t, e:</ strong > Your password is never stored. It's used to derive wal let keys using PBKDF2 with 600,000 iterations. </ p > </ div > ) } </ DialogContent > </ Dialog > ) }
