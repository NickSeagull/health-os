import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Защита изменяющих запросов от вредоносной вкладки в браузере.
 *
 * Дашборд привязан к `127.0.0.1`, и это защищает от злоумышленника в сети.
 * Против CSRF привязка к loopback не даёт **ничего**: браузер жертвы работает
 * на той же машине, поэтому открытая в соседней вкладке страница может
 * отправить запрос на `127.0.0.1:3000` и попасть в тот же сервер.
 *
 * Проверено практически до появления этого файла: `PUT /api/profile`
 * с посторонним `Origin` и `Content-Type: text/plain` возвращал
 * `{"success":true}` и затирал блок `basic` в профиле — дату рождения, пол,
 * рост. Тип `text/plain` выбран не случайно: он относится к «простым»
 * запросам и не вызывает preflight, то есть браузер отправляет его без
 * предварительного разрешения сервера.
 *
 * Здесь закрываются два вектора:
 *
 * 1. **CSRF.** У изменяющих запросов сверяются `Origin` и `Sec-Fetch-Site`.
 *    Браузер проставляет их сам, и подделать их со страницы нельзя.
 * 2. **DNS rebinding.** Домен злоумышленника, резолвящийся в `127.0.0.1`,
 *    обходит привязку к loopback. Заголовок `Host` при этом остаётся чужим,
 *    поэтому он проверяется отдельно.
 *
 * Запрос без `Origin` и без `Sec-Fetch-Site` — это не браузер, а `curl` или
 * скрипт. Такой запрос пропускается: CSRF-вектором он не является, а тот,
 * кто уже исполняет команды на машине, в обходе дашборда не нуждается.
 */

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Хост признаётся своим, если это петлевой интерфейс. Порт значения не имеет. */
function isLoopbackHost(host: string | null): boolean {
  if (!host) return false;
  // Возможные формы: 127.0.0.1:3000, localhost:3000, [::1]:3000
  const hostname = host.startsWith("[")
    ? host.slice(0, host.indexOf("]") + 1)
    : host.split(":")[0];
  return (
    hostname === "127.0.0.1" ||
    hostname === "localhost" ||
    hostname === "[::1]" ||
    hostname === "::1"
  );
}

function originMatchesHost(origin: string, host: string | null): boolean {
  if (!host) return false;
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  return isLoopbackHost(parsed.host) && parsed.host === host;
}

function deny(reason: string): NextResponse {
  return NextResponse.json(
    {
      error:
        "Запрос отклонён: он пришёл не из дашборда. " +
        "Так выглядит попытка стороннего сайта изменить ваши данные " +
        "через открытый на этой машине дашборд.",
      reason,
    },
    { status: 403 }
  );
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host");

  // DNS rebinding: чужое имя, резолвнутое в 127.0.0.1, приходит с чужим Host
  if (!isLoopbackHost(host)) {
    return deny("host-not-loopback");
  }

  if (!UNSAFE.has(request.method)) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");
  if (origin !== null) {
    return originMatchesHost(origin, host)
      ? NextResponse.next()
      : deny("origin-mismatch");
  }

  // Origin отсутствует. Современные браузеры присылают его для изменяющих
  // запросов всегда, поэтому проверяем метаданные выборки как второй сигнал.
  const site = request.headers.get("sec-fetch-site");
  if (site !== null && site !== "same-origin" && site !== "none") {
    return deny("cross-site-fetch");
  }

  // Ни Origin, ни Sec-Fetch-Site — запрос не из браузера
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
