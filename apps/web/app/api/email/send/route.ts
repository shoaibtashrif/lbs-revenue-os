export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { z } from 'zod'

const SendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  text: z.string().min(1),
  html: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = SendEmailSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid email payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { to, subject, text, html } = parsed.data

    const smtpHost = process.env.SMTP_SERVER || 'smtp.gmail.com'
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10)
    const emailUser = process.env.EMAIL_USER || 'shoaib.tashrif@gmail.com'
    const emailPass = process.env.EMAIL_PASSWORD || 'fmrntnzbpmvhskbd'
    const emailFrom = process.env.EMAIL_FROM || `lbs. Distribution <${emailUser}>`

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false, // TLS 587
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })

    const info = await transporter.sendMail({
      from: emailFrom,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br/>'),
    })

    console.log('[Email API] Sent real email via Gmail SMTP:', info.messageId, 'to:', to)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      sentTo: to,
      message: `Email sent successfully to ${to}`,
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('[Email API] Error sending email via SMTP:', errorMsg)
    return NextResponse.json(
      { success: false, error: `Failed to send email: ${errorMsg}` },
      { status: 500 }
    )
  }
}
