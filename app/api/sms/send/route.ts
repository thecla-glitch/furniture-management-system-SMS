"use server"

import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/sms/send
 *
 * Body: { to: string, message: string, from?: string }
 *
 * This route is a generic proxy layer. Set the env vars below in your
 * Vercel project (or .env.local) to connect your SMS provider:
 *
 *   SMS_PROVIDER_BASE_URL   — the provider's REST send endpoint
 *                             e.g. https://api.yoursms.com/v1/messages
 *   SMS_API_KEY             — your provider API key / token
 *   SMS_SENDER_ID           — default sender name/number
 *
 * The request body is forwarded as JSON. If your provider expects a
 * different schema (XML, form-data, different field names), update
 * buildPayload() below to match.
 */

function buildPayload(
  to: string,
  message: string,
  from: string
): Record<string, string> {
  // Generic REST SMS schema — adjust field names for your specific provider.
  // Common alternatives: recipient/body/originator, phone/text/from, etc.
  return {
    to,
    from,
    message,
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body || typeof body.to !== "string" || typeof body.message !== "string") {
    return NextResponse.json(
      { error: "Missing required fields: to, message" },
      { status: 400 }
    )
  }

  const baseUrl = process.env.SMS_PROVIDER_BASE_URL
  const apiKey = process.env.SMS_API_KEY
  const defaultSender = process.env.SMS_SENDER_ID ?? "FurnitureCo"
  const senderId = (body.from as string | undefined) ?? defaultSender

  // If no provider is configured, return a simulated success so the rest of
  // the UI works without live credentials.
  if (!baseUrl || !apiKey) {
    return NextResponse.json({
      status: "simulated",
      message: "No SMS provider configured. Set SMS_PROVIDER_BASE_URL and SMS_API_KEY to enable real delivery.",
      to: body.to,
      preview: body.message,
    })
  }

  try {
    const payload = buildPayload(body.to, body.message, senderId)

    const upstream = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // Some providers use a header API key instead:
        // "api-key": apiKey,
      },
      body: JSON.stringify(payload),
    })

    const text = await upstream.text()
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Provider rejected the request", detail: data, status: upstream.status },
        { status: 502 }
      )
    }

    return NextResponse.json({ status: "sent", provider: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: "Network error", detail: message }, { status: 503 })
  }
}
