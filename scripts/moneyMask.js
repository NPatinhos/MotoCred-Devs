// moneyMask.js
// Respons├ível por formata├º├úo e parsing de valores monet├írios estilo BRL.
// Ele:
//  - mant├®m o input sempre em "R$ 12.345,67"
//  - te d├í uma forma f├ícil de extrair n├║mero puro pra validar/enviar

// ----------------------
// Internos de formata├º├úo/parsing
// ----------------------

// Recebe uma string tipo "R$ 1.234,56" ou "123456" e devolve Number 1234.56
export function parseBRLToNumber(str) {
  if (!str) return NaN;

  // remove tudo que n├úo ├® d├¡gito
  const digitsOnly = str.replace(/\D/g, "");
  if (!digitsOnly) return NaN;

  // ├║ltimos 2 d├¡gitos = centavos
  // exemplo: "123456" -> 1234.56
  const intPart = digitsOnly.slice(0, -2) || "0";
  const centsPart = digitsOnly.slice(-2);

  const normalized = `${intPart}.${centsPart}`; // "1234.56"
  return Number(normalized);
}

// Recebe s├│ d├¡gitos ("123456") e devolve string "R$ 1.234,56"
function formatDigitsAsBRL(digitsStr) {
  if (!digitsStr) {
    return "R$ 0,00";
  }

  // se tiver s├│ 1 d├¡gito ("5") -> "0,05"
  // se tiver s├│ 2 d├¡gitos ("50") -> "0,50"
  const intPart = digitsStr.slice(0, -2) || "0";
  const centsPart = digitsStr.slice(-2).padStart(2, "0");

  // monta n├║mero inteiro para poder usar Intl.NumberFormat
  const intNumber = Number(intPart);

  // formata parte inteira com separador de milhar
  const intFormatted = intNumber.toLocaleString("pt-BR");

  // junta parte inteira formatada + v├¡rgula + centavos
  return `R$ ${intFormatted},${centsPart}`;
}

// pega um valor num├®rico (ex: 1234.56) e devolve "R$ 1.234,56"
export function formatNumberToBRL(valueNumber) {
  if (valueNumber == null || Number.isNaN(valueNumber)) {
    return "R$ 0,00";
  }

  // for├ºa duas casas decimais
  const fixed = Math.round(valueNumber * 100).toString(); // "123456"
  return formatDigitsAsBRL(fixed);
}

// ----------------------
// M├íscara viva no input
// ----------------------

// Essa fun├º├úo "conecta" um <input> de dinheiro para:
//  - bloquear caracteres n├úo num├®ricos
//  - sempre reescrever o valor no formato BRL
//  - manter o cursor no final
//
// IMPORTANTE: a abordagem ├® baseada em 'beforeinput' pra impedir que caracteres inv├ílidos cheguem no campo.
// Voc├¬ j├í usa algo assim no seu script atual.
export function attachCurrencyMask(inputEl) {
  // estado interno: apenas d├¡gitos, sem v├¡rgula e sem ponto, ex: "123456" = 1234,56
  let digitsState = "";

  // Inicializa├º├úo: se j├í veio com algum valor no HTML, normaliza
  initFromExistingValue();

  function initFromExistingValue() {
    const existingDigits = inputEl.value.replace(/\D/g, "");
    if (existingDigits) {
      digitsState = existingDigits;
    } else {
      digitsState = "";
    }
    syncInput();
  }

  function syncInput() {
    const allowEmpty = inputEl.dataset.allowEmpty === 'true';
    const valueToSet =
      digitsState.length === 0 && allowEmpty
        ? ''
        : formatDigitsAsBRL(digitsState);

    inputEl.value = valueToSet;
    // garante cursor sempre no final
    requestAnimationFrame(() => {
      inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
    });
  }

  // Intercepta qualquer digita├º├úo ANTES de chegar no campo
  inputEl.addEventListener("beforeinput", (ev) => {
    const { inputType, data } = ev;

    if (inputType === "deleteContentBackward") {
      // backspace: remove ├║ltimo d├¡gito
      digitsState = digitsState.slice(0, -1);
      syncInput();
      ev.preventDefault();
      return;
    }

    if (inputType === "insertText") {
      // s├│ aceita n├║mero
      if (!/[0-9]/.test(data)) {
        ev.preventDefault();
        return;
      }

      // adiciona o d├¡gito no final
      digitsState += data;
      // mata zeros ├á esquerda exagerados: "000123" vira "123"? N├âO obrigatoriamente.
      // mas se quiser limitar crescimento absurdo depois a gente trata
      syncInput();
      ev.preventDefault();
      return;
    }

    // Bloqueia qualquer outra modifica├º├úo direta (colar texto, etc.)
    if (inputType === "insertFromPaste") {
      // cola: pega s├│ d├¡gitos do que colou
      const pasted = (ev.clipboardData || window.clipboardData)?.getData("text") || "";
      const only = pasted.replace(/\D/g, "");
      if (only) {
        digitsState += only;
      }
      syncInput();
      ev.preventDefault();
      return;
    }

    // Por seguran├ºa, bloqueia qualquer coisa que n├úo lidamos explicitamente
    ev.preventDefault();
  });

  // Exponho um helper interno pro chamador conseguir ler o valor num├®rico atual
  function getNumericValue() {
    // digitsState "123456" -> 1234.56
    if (!digitsState) return 0;
    const intPart = digitsState.slice(0, -2) || "0";
    const centsPart = digitsState.slice(-2).padStart(2, "0");
    const normalized = `${intPart}.${centsPart}`;
    return Number(normalized);
  }

  // Devolvo um objeto de controle pro caller, caso queira ler ou resetar depois
  return {
    getNumericValue,
    setValueFromNumber(numberValue) {
      if (numberValue == null || Number.isNaN(numberValue)) {
        digitsState = "";
      } else {
        // transforma n├║mero ex: 1234.56 -> "123456"
        const cents = Math.round(numberValue * 100);
        digitsState = String(cents);
      }
      syncInput();
    },
    clear() {
      digitsState = "";
      syncInput();
    },
  };
}


// Recebe um Number (1234.56) e devolve string "R$ 1.234,56"
export function formatBRLFromNumber(numberValue) {
    if (numberValue == null || isNaN(numberValue)) return "R$ 0,00";
    // Usamos toLocaleString para formata├º├úo monet├íria correta (R$)
    return (Number(numberValue) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
// ----------------------
// Leitura simples (uso r├ípido no submit)
// ----------------------

// Se voc├¬ n├úo quer guardar o controller retornado por attachCurrencyMask()
// e s├│ quer ler pontualmente um input que j├í est├í mascarado em BRL,
// voc├¬ pode usar isso no momento de validar/enviar:
export function getNumericValueFromCurrencyInput(inputEl) {
  return parseBRLToNumber(inputEl.value);
}
