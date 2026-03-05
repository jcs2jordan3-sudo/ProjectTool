import { NextResponse } from "next/server";

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
