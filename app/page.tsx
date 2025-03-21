import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import hero from "/public/hero.png";

import { Button } from "@/components/ui/button";
import ExplainerSection from "@/components/ExplainerSection";
import PricingSection from "@/components/PricingSection";

export const dynamic = "force-dynamic";

export default async function Index() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return redirect("/overview");
  }

  return (
    <div className="flex flex-col items-center pt-16">
      <div className="flex flex-col lg:flex-row items-center gap-8 p-8 max-w-6xl w-full">
        <div className="flex flex-col space-y-4 lg:w-1/2 w-full">
          <h1 className="text-5xl font-bold">
            Профессиональные AI-портреты за минуты.
          </h1>
          <p className="text-gray-600 text-lg">
            Поднимите свое онлайн-присутствие на новый уровень с HD-портретами, созданными нашим ИИ. Идеально для социальных сетей, резюме и профессиональных портфолио.
          </p>
          <div className="flex flex-col space-y-2">
            <Link href="/login">
              <Button className="w-full lg:w-1/2">Получить портреты</Button>
            </Link>
            <p className="text-sm text-gray-500 italic">
              Проверено профессионалами по всему миру. Быстро и эффективно.
            </p>
          </div>
          <div className="mt-4 text-gray-500">
            <span>Уже зарегистрированы? </span>
            <Link className="text-blue-600 hover:underline" href="/login">
              Войдите
            </Link>
          </div>
        </div>
        <div className="lg:w-1/2 w-full mt-8 lg:mt-0">
          <img
            src={hero.src}
            alt="Иллюстрация AI-портрета"
            className="rounded-lg object-cover w-full h-full"
          />
        </div>
      </div>
      <ExplainerSection />
      <PricingSection />
    </div>
  );
}