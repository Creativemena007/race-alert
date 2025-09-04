'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function UnsubscribeForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for URL parameters (from email links)
    const success = searchParams.get('success')
    const already = searchParams.get('already')
    const error = searchParams.get('error')
    const emailParam = searchParams.get('email')

    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    }

    if (success === 'true') {
      if (already === 'true') {
        setMessage({
          type: 'info',
          text: 'You were already unsubscribed from all race alerts.'
        })
      } else {
        setMessage({
          type: 'success',
          text: '✅ You have been successfully unsubscribed from all race alerts.'
        })
      }
    } else if (error) {
      let errorMessage = 'An error occurred while unsubscribing.'
      if (error === 'missing-email') errorMessage = 'Email address is required.'
      else if (error === 'invalid-request') errorMessage = 'Invalid unsubscribe request.'
      else errorMessage = decodeURIComponent(error)

      setMessage({
        type: 'error',
        text: errorMessage
      })
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim()
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.alreadyUnsubscribed) {
          setMessage({
            type: 'info',
            text: 'You were already unsubscribed from all race alerts.'
          })
        } else {
          setMessage({
            type: 'success',
            text: '✅ You have been successfully unsubscribed from all race alerts.'
          })
        }
        setEmail('')
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to unsubscribe. Please try again.'
        })
      }
    } catch (error) {
      console.error('Unsubscribe error:', error)
      setMessage({
        type: 'error',
        text: 'Network error. Please check your connection and try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Unsubscribe from Race Alerts
            </h1>
            <p className="text-gray-600">
              We&apos;re sorry to see you go! Enter your email address to unsubscribe from all marathon registration alerts.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="your@email.com"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Unsubscribing...' : 'Unsubscribe'}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200'
                : message.type === 'error'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-3">
              Changed your mind?
            </p>
            <Link 
              href="/"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              ← Back to Race Alert
            </Link>
          </div>

          <div className="mt-4 text-xs text-gray-400 text-center">
            <p>
              Note: It may take up to 24 hours to process your unsubscribe request.
              If you continue to receive emails, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <UnsubscribeForm />
    </Suspense>
  )
}