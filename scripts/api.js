// api.js
// Camada de acesso a serviços externos.
// Hoje: envio do formulário para Google Apps Script (ou backend).
// Mantém interface estável para trocar endpoint futuramente sem quebrar o resto.

const WEB_APP_URL = '<<COLE_SUA_URL_DO_APPS_SCRIPT_AQUI>>'; 
// Ex.: 'https://script.google.com/macros/s/AKfycbz.../exec'

/**
 * Envia os dados do formulário para o Apps Script usando POST (x-www-form-urlencoded).
 * @param {object} payload - Objeto com os dados já limpos (vem do appState).
 * @returns {Promise<{success: boolean, data?: any, status?: number}>}
 */
export async function postToAppsScript(payload) {
  const body = new URLSearchParams({
    data: JSON.stringify(payload),
  }).toString();

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 15000); // 15s

  try {
    const res = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body,
      signal: ctrl.signal,
    });

    clearTimeout(timeout);

    const status = res.status;
    let data = null;

    // Apps Script pode responder com JSON ou texto; tentamos JSON primeiro
    const text = await res.text();
    try { data = JSON.parse(text); } catch { data = text; }

    // Normalizamos saída para o resto do app
    const ok = res.ok && !data?.error && data !== 'error';

    return {
      success: !!ok,
      data,
      status,
    };
  } catch (err) {
    clearTimeout(timeout);
    // Erro de rede / timeout / CORS etc.
    return {
      success: false,
      data: { error: String(err?.message || err) },
      status: 0,
    };
  }
}

/**
 * (Opcional) Trocar a URL em runtime sem editar o arquivo.
 * Útil para alternar entre DEV / PROD.
 */
export function setWebAppUrl(url) {
  if (typeof url === 'string' && url.startsWith('http')) {
    // eslint-disable-next-line no-global-assign
    WEB_APP_URL = url; // se seu bundler não permitir reatribuição, remova esta função
  }
}
