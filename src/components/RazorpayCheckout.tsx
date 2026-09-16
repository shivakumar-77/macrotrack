'use client'

import { useState } from 'react'

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayPaymentResponse) => void
  modal: { ondismiss: () => void }
}

interface RazorpayInstance {
  open: () => void
  on: (event: 'payment.failed', callback: () => void) => void
}

interface RazorpayCheckoutProps {
  amount: number
  description: string
  label: string
}

function loadCheckoutScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true)

  return new Promise(resolve => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function RazorpayCheckout({ amount, description, label }: RazorpayCheckoutProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID

  const startCheckout = async () => {
    if (!keyId) {
      setStatus('error')
      setMessage('Payments are not configured.')
      return
    }

    setStatus('loading')
    setMessage('Preparing secure checkout...')

    try {
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: 'INR', receipt: `kayven_${Date.now()}` }),
      })
      const order = await orderResponse.json()
      if (!orderResponse.ok) throw new Error(order.error || 'Unable to create payment order.')

      if (!await loadCheckoutScript() || !window.Razorpay) throw new Error('Unable to load secure checkout.')

      const checkout = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'KAYVEN',
        description,
        order_id: order.order_id,
        handler: async payment => {
          try {
            const verificationResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payment),
            })
            const verification = await verificationResponse.json()
            if (!verificationResponse.ok || !verification.success) throw new Error(verification.error || 'Payment verification failed.')
            setStatus('success')
            setMessage('Payment verified successfully.')
          } catch (error) {
            setStatus('error')
            setMessage(error instanceof Error ? error.message : 'Payment verification failed.')
          }
        },
        modal: {
          ondismiss: () => {
            setStatus('idle')
            setMessage('Payment was cancelled.')
          },
        },
      })
      checkout.on('payment.failed', () => {
        setStatus('error')
        setMessage('Payment failed. No charge was completed.')
      })
      checkout.open()
      setStatus('idle')
      setMessage('')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Unable to start checkout.')
    }
  }

  return <div>
    <button type="button" onClick={startCheckout} disabled={status === 'loading'} aria-busy={status === 'loading'} style={{ padding: '11px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--primary)', color: '#fff', fontWeight: 700 }}>
      {status === 'loading' ? 'Opening checkout...' : label}
    </button>
    {message && <p role="status" aria-live="polite" style={{ marginTop: 10, color: status === 'error' ? 'var(--red)' : 'var(--muted)', fontSize: 13 }}>{message}</p>}
  </div>
}