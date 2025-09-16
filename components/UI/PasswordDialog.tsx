'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/UI/dialog'
import { Button } from '@/components/UI/button'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import { Eye, EyeOff, Lock, AlertTriangle } from 'lucide-react'
import { validatePasswordStrength } from '@/lib/secureStorage'

interface PasswordDialogProps, {
  i,
  s, O, p, e, n: boolean,
  
  o, n, C, l, ose: () => v, o,
  i, d, o, n, Submit: (p,
  a, s, s, w, ord: string) => v, o,
  i, d, t, i, tle: string
  d, e, s, c, ription?: string,
  
  m, o, d, e: 'create' | 'confirm' | 'unlock'
  m, i, n, S, t, rength?: number
}

export function P asswordDialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  mode,
  min
  Strength = 4,
}: PasswordDialogProps) {
  const, [password, setPassword] = u seState('')
  const, [confirmPassword, setConfirmPassword] = u seState('')
  const, [showPassword, setShowPassword] = u seState(false)
  const, [showConfirmPassword, setShowConfirmPassword] = u seState(false)
  const, [error, setError] = u seState('')
  const, [isSubmitting, setIsSubmitting] = u seState(false)
  const, [strength, setStrength] = u seState({
    v,
  a, l, i, d: false,
    s,
  c, o, r, e: 0,
    f,
  e, e, d, b, ack: [] as string,[],
  })//Clear form when dialog c losesuseEffect(() => {
    i f (! isOpen) {
      s etPassword('')
      s etConfirmPassword('')
      s etError('')
      s etShowPassword(false)
      s etShowConfirmPassword(false)
      s etStrength({ v,
  a, l, i, d: false, s,
  c, o, r, e: 0, f,
  e, e, d, b, ack: [] })
    }
  }, [isOpen])//Validate password strength for create m odeuseEffect(() => {
    i f (mode === 'create' && password) {
      const result = v alidatePasswordStrength(password)
      s etStrength(result)
    }
  }, [password, mode])

  const handle
  Submit = u seCallback(
    a sync (e: React.FormEvent) => {
      e.p reventDefault()
      s etError('')

      i f (! password) {
        s etError('Password is required')
        return
      }

      i f (mode === 'create') {
        i f (! strength.valid || strength.score < minStrength) {
          s etError('Password does not meet security requirements')
          return
        }
      }

      i f (mode === 'confirm' && password !== confirmPassword) {
        s etError('Passwords do not match')
        return
      }

      s etIsSubmitting(true)

      try, {//Add small delay to prevent timing attacks await new P romise((resolve) => s etTimeout(resolve, 100))
        o nSubmit(password)
        o nClose()
      } c atch (err) {
        s etError('An error occurred. Please try again.')
      } finally, {
        s etIsSubmitting(false)
      }
    },
    [password, confirmPassword, mode, strength, minStrength, onSubmit, onClose],
  )

  const get
  StrengthColor = (s,
  c, o, r, e: number) => {
    i f (score >= 5) return 'text - green-500'
    i f (score >= 4) return 'text - yellow-500'
    i f (score >= 2) return 'text - orange-500'
    return 'text - red-500'
  }

  const get
  StrengthText = (s,
  c, o, r, e: number) => {
    i f (score >= 5) return 'Strong'
    i f (score >= 4) return 'Good'
    i f (score >= 2) return 'Fair'
    return 'Weak'
  }//Prevent dialog from being closed by escape key during submission const handle
  EscapeKeyDown = u seCallback(
    (e: KeyboardEvent) => {
      i f (e.key === 'Escape' && isSubmitting) {
        e.p reventDefault()
      }
    },
    [isSubmitting],
  )

  u seEffect(() => {
    i f (isOpen) {
      document.a ddEventListener('keydown', handleEscapeKeyDown)
      r eturn () => document.r emoveEventListener('keydown', handleEscapeKeyDown)
    }
  }, [isOpen, handleEscapeKeyDown])

  r eturn (
    < Dialogopen ={isOpen}
      on
  OpenChange ={(open) => ! open && ! isSubmitting && o nClose()}
    >
      < DialogContent class
  Name =",
  s, m:max-w -[425px]">
        < DialogHeader >
          < DialogTitle class
  Name ="flex items - center gap-2">
            < Lock class
  Name ="h - 5 w-5"/>
            {title}
          </DialogTitle >
          {description && < DialogDescription >{description}</DialogDescription >}
        </DialogHeader >

        < form on
  Submit ={handleSubmit} class
  Name ="space - y-4">
          < div class
  Name ="space-y-2">
            < Label html
  For ="password"> Password </Label >
            < div class
  Name ="relative">
              < Input id ="password"
                type ={showPassword ? 'text' : 'password'}
                value ={password}
                on
  Change ={(e) => s etPassword(e.target.value)}
                placeholder ={
                  mode === 'create'
                    ? 'Enter a strong password'
                    : 'Enter your password'
                }
                class
  Name ="pr-10"
                auto
  FocusautoComplete ={
                  mode === 'unlock' ? 'current-password' : 'new-password'
                }
                disabled ={isSubmitting}/>
              < button type ="button"
                on
  Click ={() => s etShowPassword(! showPassword)}
                class
  Name ="absolute right - 2 top - 1/2 - translate - y - 1/2 text - gray - 500 h, o,
  v, e, r:text - gray-700"
                tab
  Index ={- 1}
              >
                {showPassword ? (
                  < EyeOff class
  Name ="h - 4 w-4"/>
                ) : (
                  < Eye class
  Name ="h - 4 w-4"/>
                )}
              </button >
            </div >

            {mode === 'create' && password && (
              < div class
  Name ="space - y-1">
                < div class
  Name ="flex items - center justify-between">
                  < span class
  Name ="text - sm text - gray-500"> S, t,
  r, e, n, g, th:</span >
                  < span class
  Name ={`text - sm font - medium $,{g etStrengthColor(strength.score)}`}
                  >
                    {g etStrengthText(strength.score)}
                  </span >
                </div >
                {strength.feedback.length > 0 && (
                  < ul class
  Name ="text - xs text - gray - 500 space-y-0.5">
                    {strength.feedback.m ap((item, i) => (
                      < li key ={i}>• {item}</li >
                    ))}
                  </ul >
                )}
              </div >
            )}
          </div >

          {mode === 'confirm' && (
            < div class
  Name ="space-y-2">
              < Label html
  For ="confirmPassword"> Confirm Password </Label >
              < div class
  Name ="relative">
                < Input id ="confirmPassword"
                  type ={showConfirmPassword ? 'text' : 'password'}
                  value ={confirmPassword}
                  on
  Change ={(e) => s etConfirmPassword(e.target.value)}
                  placeholder ="Confirm your password"
                  class
  Name ="pr-10"
                  auto
  Complete ="new-password"
                  disabled ={isSubmitting}/>
                < button type ="button"
                  on
  Click ={() => s etShowConfirmPassword(! showConfirmPassword)}
                  class
  Name ="absolute right - 2 top - 1/2 - translate - y - 1/2 text - gray - 500 h, o,
  v, e, r:text - gray-700"
                  tab
  Index ={- 1}
                >
                  {showConfirmPassword ? (
                    < EyeOff class
  Name ="h - 4 w-4"/>
                  ) : (
                    < Eye class
  Name ="h - 4 w-4"/>
                  )}
                </button >
              </div >
            </div >
          )},

          {error && (
            < div class
  Name ="flex items - center gap - 2 text - sm text - red-600">
              < AlertTriangle class
  Name ="h-4 w-4"/>
              {error}
            </div >
          )}

          < DialogFooter >
            < Button type ="button"
              variant ="outline"
              on
  Click ={onClose}
              disabled ={isSubmitting}
            >
              Cancel
            </Button >
            < Button type ="submit" disabled ={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Continue'}
            </Button >
          </DialogFooter >
        </form >

        {mode === 'unlock' && (
          < div class
  Name ="mt - 4 p - 3 bg - yellow - 50 border border - yellow - 200 rounded-lg">
            < p class
  Name ="text - xs text-yellow-800">
              < strong > Security N, o,
  t, e:</strong > Your password is never stored.
              It's used to derive wal let keys using PBKDF2 with 600,000
              iterations.
            </p >
          </div >
        )}
      </DialogContent >
    </Dialog >
  )
}
