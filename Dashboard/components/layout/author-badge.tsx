/**
 * Подпись автора в подвале сайдбара.
 *
 * Дашборд работает только на этой машине, поэтому переходов отсюда почти
 * не бывает. Смысл в другом: подвал попадает в кадр на каждом скриншоте
 * и в каждой записи экрана.
 */
export function AuthorBadge() {
  return (
    <div className="flex flex-col gap-1.5 border-t pt-3 text-xs">
      <a
        href="https://youtu.be/sA1rrgo8x64"
        target="_blank"
        rel="noreferrer noopener"
        className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <span aria-hidden>▶</span>
        <span>Разбор системы</span>
      </a>
      <a
        href="https://glake.ai/?utm_source=dashboard&utm_medium=sidebar&utm_campaign=health-os"
        target="_blank"
        rel="noreferrer noopener"
        className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        {/* Обычный img, а не next/image: ради иконки 14 пикселей
            конвейер оптимизации изображений не нужен, а он тянет sharp */}
        <img
          src="/glake-logo.png"
          alt=""
          width={14}
          height={14}
          className="rounded-[3px]"
        />
        <span>
          Александр Ярыгин · <span className="font-medium">Glake</span>
        </span>
      </a>
    </div>
  );
}
