'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './dialog'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Eye, EyeOff, Lock, AlertTriangle } from 'lucide-react'
import { validatePasswordStrength } from '@/lib/secureStorage'

interface PasswordDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (password: string) => void
  title: string
  description?: string
  mode: 'create' | 'confirm' | 'unlock'
  minStrength?: number
}

export function PasswordDialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  mode,
  minStrength = 4,
}: PasswordDialogProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [strength, setStrength] = useState({
    valid: false,
    score: 0,
    feedback: [] as string[],
  })

  // Clear form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setPassword('')
      setConfirmPassword('')
      setError('')
      setShowPassword(false)
      setShowConfirmPassword(false)
      setStrength({ valid: false, score: 0, feedback: [] })
    }
  }, [isOpen])

  // Validate password strength for create mode
  useEffect(() => {
    if (mode === 'create' && password) {
      const result = validatePasswordStrength(password)
      setStrength(result)
    }
  }, [password, mode])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')

      if (!password) {
        setError('Password is required')
        return
      }

      if (mode === 'create') {
        if (!strength.valid || strength.score < minStrength) {
          setError('Password does not meet security requirements')
          return
        }
      }

      if (mode === 'confirm' && password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      setIsSubmitting(true)

      try {
        // Add small delay to prevent timing attacks
        await new Promise((resolve) => setTimeout(resolve, 100))
        onSubmit(password)
        onClose()
      } catch (err) {
        setError('An error occurred. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [password, confirmPassword, mode, strength, minStrength, onSubmit, onClose],
  )

  const getStrengthColor = (score: number) => {
    if (score >= 5) return 'text-green-500'
    if (score >= 4) return 'text-yellow-500'
    if (score >= 2) return 'text-orange-500'
    return 'text-red-500'
  }

  const getStrengthText = (score: number) => {
    if (score >= 5) return 'Strong'
    if (score >= 4) return 'Good'
    if (score >= 2) return 'Fair'
    return 'Weak'
  }

  // Prevent dialog from being closed by escape key during submission
  const handleEscapeKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSubmitting) {
        e.preventDefault()
      }
    },
    [isSubmitting],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKeyDown)
      return () => document.removeEventListener('keydown', handleEscapeKeyDown)
    }
  }, [isOpen, handleEscapeKeyDown])

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === 'create'
                    ? 'Enter a strong password'
                    : 'Enter your password'
                }
                className="pr-10"
                autoFocus
                autoComplete={
                  mode === 'unlock' ? 'current-password' : 'new-password'
                }
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {mode === 'create' && password && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Strength:</span>
                  <span
                    className={`text-sm font-medium ${getStrengthColor(strength.score)}`}
                  >
                    {getStrengthText(strength.score)}
                  </span>
                </div>
                {strength.feedback.length > 0 && (
                  <ul className="text-xs text-gray-500 space-y-0.5">
                    {strength.feedback.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {mode === 'confirm' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="pr-10"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Continue'}
            </Button>
          </DialogFooter>
        </form>

        {mode === 'unlock' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Security Note:</strong> Your password is never stored.
              It's used to derive wallet keys using PBKDF2 with 600,000
              iterations.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
