import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { smtpConfig } = await req.json()

    if (!smtpConfig?.host || !smtpConfig?.user || !smtpConfig?.pass) {
      return NextResponse.json({ error: 'Uzupelnij host, login i haslo SMTP.' }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: Number(smtpConfig.port ?? 465),
      secure: smtpConfig.secure !== false,
      auth: { user: smtpConfig.user, pass: smtpConfig.pass },
    })

    await transporter.verify()

    // Send a real test email to the configured address
    await transporter.sendMail({
      from: `${smtpConfig.fromName ?? 'Zwrotny.pl'} <${smtpConfig.fromEmail ?? smtpConfig.user}>`,
      to: smtpConfig.user,
      subject: 'Test SMTP — Zwrotny.pl newsletter',
      html: '<p>Polaczenie SMTP dziala poprawnie. Mozesz wysylac kampanie newslettera.</p>',
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Blad polaczenia SMTP' },
      { status: 500 }
    )
  }
}
