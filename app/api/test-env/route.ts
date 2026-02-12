import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    finnhubKeyExists: !!process.env.FINNHUB_API_KEY,
    finnhubKeyLength: process.env.FINNHUB_API_KEY?.length || 0,
    anthropicKeyExists: !!process.env.ANTHROPIC_API_KEY,
    nodeEnv: process.env.NODE_ENV,
  });
}
