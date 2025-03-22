import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get('token');

  // Логика обработки запроса
  return NextResponse.json({ message: "Success", token });
}
