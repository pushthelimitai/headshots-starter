import { Database } from "@/types/supabase";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("MISSING NEXT_PUBLIC_SUPABASE_URL!");
}

if (!supabaseServiceRoleKey) {
  throw new Error("MISSING SUPABASE_SERVICE_ROLE_KEY!");
}

export async function POST(request: Request) {
  const supabase = createClient<Database>(
    supabaseUrl as string,
    supabaseServiceRoleKey as string,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

  // Заглушка для идентификатора пользователя
  const userId = "free_user"; 
  const totalCreditsPurchased = 10; // Заглушка для количества кредитов

  const { data: existingCredits } = await supabase
    .from("credits")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Если у пользователя уже есть кредиты, добавляем к ним
  if (existingCredits) {
    const newCredits = existingCredits.credits + totalCreditsPurchased;
    const { data, error } = await supabase
      .from("credits")
      .update({
        credits: newCredits,
      })
      .eq("user_id", userId);

    if (error) {
      console.log(error);
      return NextResponse.json(
        {
          message: `Error updating credits: ${JSON.stringify(error)}. data=${data}`,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        message: "success",
      },
      { status: 200 }
    );
  } else {
    // Иначе создаем новую запись о кредитах
    const { data, error } = await supabase.from("credits").insert({
      user_id: userId,
      credits: totalCreditsPurchased,
    });

    if (error) {
      console.log(error);
      return NextResponse.json(
        {
          message: `Error creating credits: ${error}\n ${data}`,
        },
        {
          status: 400,
        }
      );
    }
  }

  return NextResponse.json(
    {
      message: "success",
    },
    { status: 200 }
  );
}
