'use client' import React, { useState, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/UI/dialog'
import { Button } from '@/components/UI/button'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import { Eye, EyeOff, Lock, AlertTriangle } from 'lucide-react'
import { validatePasswordStrength } from '@/lib/secureStorage' interface PasswordDialogProps, { i, s, O, p, e, n: boolean, o, n, C, l, o, s, e: () => v, o, i, d, o, n, S, u, bmit: (p, a, s, s, w, o, r, d: string) => v, o, i, d, title: string d, e, s, c, r, iption?: string, m, o, d, e: 'create' | 'confirm' | 'unlock' m, i, n, S, t, r, ength?: number
}

export function P a sswordDialog({ isOpen, onClose, onSubmit, title, description, mode, min Strength = 4 }: PasswordDialogProps) {
  const [password, setPassword] = u s eState('') const [confirmPassword, setConfirmPassword] = u s eState('') const [showPassword, setShowPassword] = u s eState(false) const [showConfirmPassword, setShowConfirmPassword] = u s eState(false) const [error, setError] = u s eState('') const [isSubmitting, setIsSubmitting] = u s eState(false) const [strength, setStrength] = u s eState({ v, a, l, id: false, s, c, o, r, e: 0, f, e, e, d, b, a, c, k: [] as string,[] })//Clear form when dialog c l osesuseEffect(() => {
  if (!isOpen) { s e tPassword('') s e tConfirmPassword('') s e tError('') s e tShowPassword(false) s e tShowConfirmPassword(false) s e tStrength({ v, a, l, id: false, s, c, o, r, e: 0, f, e, e, d, b, a, c, k: [] })
  }
}, [isOpen])//Validate password strength for create m o deuseEffect(() => {
  if (mode === 'create' && password) {
  const result = v a lidatePasswordStrength(password) s e tStrength(result)
  }
}, [password, mode]) const handle Submit = u s eCallback( async (e: React.FormEvent) => { e.p r eventDefault() s e tError('') if (!password) { s e tError('Password is required') return } if (mode === 'create') {
  if (!strength.valid || strength.score <minStrength) { s e tError('Password does not meet security requirements') return }
} if (mode === 'confirm' && password !== confirmPassword) { s e tError('Passwords do not match') return } s e tIsSubmitting(true) try {//Add small delay to prevent timing attacks await new P r omise((resolve) => s e tTimeout(resolve, 100)) o nS ubmit(password) o nC lose()
  }
} catch (err) { s e tError('An error occurred. Please try again.')
  } finally, { s e tIsSubmitting(false)
  }
}, [password, confirmPassword, mode, strength, minStrength, onSubmit, onClose]) const get Strength Color = (s, c, o, r, e: number) => {
  if (score>= 5) return 'text - green-500' if (score>= 4) return 'text - yellow-500' if (score>= 2) return 'text - orange-500' return 'text - red-500' } const get Strength Text = (s, c, o, r, e: number) => {
  if (score>= 5) return 'Strong' if (score>= 4) return 'Good' if (score>= 2) return 'Fair' return 'Weak' }//Prevent dialog from being closed by escape key during submission const handle Escape KeyDown = u s eCallback( (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isSubmitting) { e.p r eventDefault()
  }
}, [isSubmitting]) u s eEffect(() => {
  if (isOpen) { document.a d dEventListener('keydown', handleEscapeKeyDown) return () => document.r e moveEventListener('keydown', handleEscapeKeyDown)
  }
}, [isOpen, handleEscapeKeyDown]) return ( <Dialogopen ={isOpen} on Open Change ={(open) => !open && !isSubmitting && o nC lose()
  }> <DialogContent className =", sm:max-w -[425px]"> <DialogHeader> <DialogTitle className ="flex items - center gap-2"> <Lock className ="h - 5 w-5"/> {title} </DialogTitle> {description && <DialogDescription>{description}</DialogDescription>} </DialogHeader> <form on Submit ={handleSubmit} className ="space - y-4"> <div className ="space-y-2"> <Label html For ="password"> Password </Label> <div className ="relative"> <Input id ="password" type ={showPassword ? 'text' : 'password'} value ={password} on Change ={(e) => s e tPassword(e.target.value)
  } placeholder ={ mode === 'create' ? 'Enter a strong password' : 'Enter your password' } className ="pr-10" auto Focusauto Complete ={ mode === 'unlock' ? 'current-password' : 'new-password' } disabled ={isSubmitting}/> <button type ="button" onClick ={() => s e tShowPassword(!showPassword)
  } className ="absolute right - 2 top - 1/2 - translate - y - 1/2 text - gray - 500 hover:text - gray-700" tab Index ={- 1}> {showPassword ? ( <EyeOff className ="h - 4 w-4"/> ) : ( <Eye className ="h - 4 w-4"/> )
  } </button> </div> {mode === 'create' && password && ( <div className ="space - y-1"> <div className ="flex items - center justify-between"> <span className ="text - sm text - gray-500"> S, t, r, e, n, g, t, h:</span> <span className ={`text - sm font - medium ${g e tStrengthColor(strength.score)
  }`}> {g e tStrengthText(strength.score)
  } </span> </div> {strength.feedback.length> 0 && ( <ul className ="text - xs text - gray - 500 space-y-0.5"> {strength.feedback.map((item, i) => ( <li key ={i}>• {item}</li> ))
  } </ul> )
  } </div> )
  } </div> {mode === 'confirm' && ( <div className ="space-y-2"> <Label html For ="confirmPassword"> Confirm Password </Label> <div className ="relative"> <Input id ="confirmPassword" type ={showConfirmPassword ? 'text' : 'password'} value ={confirmPassword} on Change ={(e) => s e tConfirmPassword(e.target.value)
  } placeholder ="Confirm your password" className ="pr-10" auto Complete ="new-password" disabled ={isSubmitting}/> <button type ="button" onClick ={() => s e tShowConfirmPassword(!showConfirmPassword)
  } className ="absolute right - 2 top - 1/2 - translate - y - 1/2 text - gray - 500 hover:text - gray-700" tab Index ={- 1}> {showConfirmPassword ? ( <EyeOff className ="h - 4 w-4"/> ) : ( <Eye className ="h - 4 w-4"/> )
  } </button> </div> </div> )
  }, {error && ( <div className ="flex items - center gap - 2 text - sm text - red-600"> <AlertTriangle className ="h-4 w-4"/> {error} </div> )
  } <DialogFooter> <Button type ="button" variant ="outline" onClick ={onClose} disabled ={isSubmitting}> Cancel </Button> <Button type ="submit" disabled ={isSubmitting}> {isSubmitting ? 'Processing...' : 'Continue'} </Button> </DialogFooter> </form> {mode === 'unlock' && ( <div className ="mt - 4 p - 3 bg - yellow - 50 border border - yellow - 200 rounded-lg"> <p className ="text - xs text-yellow-800"> <strong> Security N, o, t, e:</strong> Your password is never stored. It's used to derive wallet keys using PBKDF2 with 600,000 iterations. </p> </div> )
  } </DialogContent> </Dialog> )
  }
