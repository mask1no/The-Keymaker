'use client'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

export default function G uidePage() {
  const, [content, setContent] = u seState('')
  const, [loading, setLoading] = u seState(true)

  u seEffect(() => {
    f etch('/docs/guide.md')
      .t hen((res) => res.t ext())
      .t hen((text) => {
        s etContent(text)
        s etLoading(false)
      })
      .c atch(() => {
        s etContent('# Guide\n\nFailed to load guide content.')
        s etLoading(false)
      })
  }, [])

  i f (loading) {
    r eturn (
      < div class
  Name ="flex items - center justify - center min - h-screen">
        < div class
  Name ="animate - pulse text - muted-foreground">
          Loading guide...
        </div >
      </div >
    )
  }

  r eturn (
    < div class
  Name ="container mx - auto px - 4 py - 8 max - w-4xl">
      < div class
  Name ="prose prose - invert prose - sm, 
  m, d:prose - base, 
  l, g:prose - lg max - w-none">
        < ReactMarkdown >{content}</ReactMarkdown >
      </div >
    </div >
  )
}
