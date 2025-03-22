import { Database } from "@/types/supabase";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from 'next/headers';
import { NextResponse } from "next/server";
 
export const dynamic = "force-dynamic";

/**
 * API эндпоинт для регистрации пользователей Telegram
 * Связывает аккаунт Supabase с ID пользователя в Telegram
 */
export async function POST(request: Request) {
  try {
    const { telegram_id, username, first_name, last_name } = await request.json();

    // Проверяем наличие telegram_id в запросе
    if (!telegram_id) {
      return NextResponse.json(
        { message: "Missing telegram_id in request" },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Получаем данные пользователя Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Проверяем, существует ли уже запись для этого пользователя
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      console.error("Ошибка при проверке существующего пользователя:", selectError);
      return NextResponse.json(
        { message: "Failed to check existing user" },
        { status: 500 }
      );
    }

    let result;

    if (existingUser) {
      // Обновляем существующую запись
      result = await supabase
        .from("users")
        .update({
          telegram_id,
          telegram_username: username,
          first_name,
          last_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    } else {
      // Создаем новую запись
      result = await supabase
        .from("users")
        .insert({
          id: user.id,
          telegram_id,
          telegram_username: username,
          first_name,
          last_name,
        });
    }

    if (result.error) {
      console.error("Ошибка при сохранении данных пользователя:", result.error);
      return NextResponse.json(
        { message: "Failed to save user data" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: "User registered successfully",
        user_id: user.id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Ошибка при регистрации пользователя Telegram:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 