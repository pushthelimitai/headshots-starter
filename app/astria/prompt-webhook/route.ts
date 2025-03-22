import { Database } from "@/types/supabase";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { notifyUserAboutReadyAvatars } from "@/telegram-bot/bot"; // Убедитесь, что путь правильный
export const dynamic = "force-dynamic";

const resendApiKey = process.env.RESEND_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const appWebhookSecret = process.env.APP_WEBHOOK_SECRET;

if (!resendApiKey) {
  console.warn(
    "We detected that the RESEND_API_KEY is missing from your environment variables. The app should still work but email notifications will not be sent. Please add your RESEND_API_KEY to your environment variables if you want to enable email notifications."
  );
}

if (!supabaseUrl) {
  throw new Error("MISSING NEXT_PUBLIC_SUPABASE_URL!");
}

if (!supabaseServiceRoleKey) {
  throw new Error("MISSING SUPABASE_SERVICE_ROLE_KEY!");
}

if (!appWebhookSecret) {
  throw new Error("MISSING APP_WEBHOOK_SECRET!");
}

export async function POST(request: Request) {
  type PromptData = {
    id: number;
    text: string;
    negative_prompt: string;
    steps: null;
    tune_id: number;
    trained_at: string;
    started_training_at: string;
    created_at: string;
    updated_at: string;
    images: string[];
  };
  
  const incomingData = (await request.json()) as { prompt: PromptData };

  const { prompt } = incomingData;

  console.log({ prompt });

  const urlObj = new URL(request.url);
  const user_id = urlObj.searchParams.get("user_id");
  const model_id = urlObj.searchParams.get("model_id");
  const webhook_secret = urlObj.searchParams.get("webhook_secret");

  if (!model_id) {
    return NextResponse.json(
      {
        message: "Malformed URL, no model_id detected!",
      },
      { status: 500 }
    );
  }  

  if (!webhook_secret) {
    return NextResponse.json(
      {
        message: "Malformed URL, no webhook_secret detected!",
      },
      { status: 500 }
    );
  }

  if (webhook_secret.toLowerCase() !== appWebhookSecret?.toLowerCase()) {
    return NextResponse.json(
      {
        message: "Unauthorized!",
      },
      { status: 401 }
    );
  }

  if (!user_id) {
    return NextResponse.json(
      {
        message: "Malformed URL, no user_id detected!",
      },
      { status: 500 }
    );
  }

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

  const {
    data: { user },
    error,
  } = await supabase.auth.admin.getUserById(user_id);

  if (error) {
    return NextResponse.json(
      {
        message: error.message,
      },
      { status: 401 }
    );
  }

  if (!user) {
    return NextResponse.json(
      {
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  try {
    // Here we join all of the arrays into one.
    const allHeadshots = prompt.images;
    
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select("*")
      .eq("id", model_id)
      .single();

    if (modelError) {
      console.error({ modelError });
      return NextResponse.json(
        {
          message: "Something went wrong!",
        },
        { status: 500 }
      );
    }

    await Promise.all(
      allHeadshots.map(async (image) => {
        const { error: imageError } = await supabase.from("images").insert({
          modelId: Number(model.id),
          uri: image,
        });
        if (imageError) {
          console.error({ imageError });
        }
      })
    );

    // Отправляем уведомление в Telegram если есть сгенерированные изображения
    if (allHeadshots.length > 0) {
      try {
        // Проверяем, есть ли у пользователя связанный Telegram ID
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("telegram_id")
          .eq("id", user_id)
          .single();

        if (!userError && userData && userData.telegram_id) {
          console.log(`Отправка уведомления в Telegram для пользователя ${user_id}, Telegram ID: ${userData.telegram_id}`);
          
          // Асинхронно отправляем уведомление, не ждем завершения
          notifyUserAboutReadyAvatars(user_id, model_id)
            .then(() => console.log('Уведомление в Telegram успешно отправлено'))
            .catch(err => console.error('Ошибка при отправке уведомления в Telegram:', err));
        } else {
          console.log(`Для пользователя ${user_id} не найден Telegram ID, уведомление не отправлено`);
        }
      } catch (telegramError) {
        // Ошибка в Telegram не должна прерывать основной поток выполнения
        console.error('Ошибка при попытке отправить уведомление в Telegram:', telegramError);
      }
    }
    
    return NextResponse.json(
      {
        message: "success",
      },
      { status: 200, statusText: "Success" }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Something went wrong!",
      },
      { status: 500 }
    );
  }
}
