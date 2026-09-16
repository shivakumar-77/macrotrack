import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    return NextResponse.json({ error: 'Payment service is not configured.' }, { status: 503 })
  }

  try {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = await request.json()

    if (![orderId, paymentId, signature].every(value => typeof value === 'string' && value.trim())) {
      return NextResponse.json({ error: 'Payment verification fields are required.' }, { status: 400 })
    }

    const expectedSignature = createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')
    const signatureBuffer = Buffer.from(signature, 'utf8')
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8')

    if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return NextResponse.json({ error: 'Payment signature verification failed.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, payment_id: paymentId, order_id: orderId })
  } catch {
    return NextResponse.json({ error: 'Unable to verify payment.' }, { status: 500 })
  }
}