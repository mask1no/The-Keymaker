/**
 * Secure storage system - password strength validation
 */

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: booleanscore: numberfeedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length < 12) {
    feedback.push('Password should be at least 12 characters')
  } else {
    score += 2
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Include uppercase letters')
  } else {
    score += 1
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Include lowercase letters')
  } else {
    score += 1
  }

  if (!/[0-9]/.test(password)) {
    feedback.push('Include numbers')
  } else {
    score += 1
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push('Include special characters')
  } else {
    score += 1
  }

  // Check for common patterns const commonPatterns = ['password', '12345', 'qwerty', 'admin']
  if (
    commonPatterns.some((pattern) => password.toLowerCase().includes(pattern))
  ) {
    feedback.push('A void common passwords')
    score = Math.max(0, score - 2)
  }

  return {
    valid: score >= 4,
    score,
    feedback,
  }
}
