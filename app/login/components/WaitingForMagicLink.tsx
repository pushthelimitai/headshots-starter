import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const WaitingForMagicLink = ({
  toggleState,
}: {
  toggleState: () => void;
}) => {
  return (
    <>
     <div className="flex items-center justify-center p-8">
        <div className="flex flex-col gap-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 p-4 rounded-xl max-w-sm w-full">
          <h1 className="text-xl">Проверьте свою почту, чтобы продолжить</h1>
          <div className="flex flex-col gap-2">
            <p className="text-sm">
              Мы отправили вам волшебную ссылку для доступа к вашему аккаунту.
            </p>
            <p className="text-xs opacity-60">
              Подсказка: проверьте папку "Спам".
            </p>
          </div>
          <div>
            <Button onClick={toggleState} variant="secondary" size="sm">
              <ArrowLeft size={14} />
              Назад
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
