import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email;
  const password = body?.password;
  const first_name = body?.first_name;
  const last_name = body?.last_name;
  const occupation = body?.occupation;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof first_name !== "string" ||
    typeof last_name !== "string"
  ) {
    return NextResponse.json(
      { error: "Email, password, first name, and last name are required." },
      { status: 400 },
    );
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, first_name, last_name, occupation }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    return NextResponse.json(
      { error: data?.detail ?? "Registration failed." },
      { status: res.status },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
