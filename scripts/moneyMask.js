// moneyMask.js
// Responsável por formatação e parsing de valores monetários estilo BRL.
// Ele:
//  - mantém o input sempre em "R$ 12.345,67"
//  - te dá uma forma fácil de extrair número puro pra validar/enviar

// ----------------------
// Internos de formatação/parsing
// ----------------------

// Recebe uma string tipo "R$ 1.234,56" ou "123456" e devolve Number 1234.56
export function parseBRLToNumber(str) {
  if (!str) return NaN;

  // remove tudo que não é dígito
  const digitsOnly = str.replace(/\D/g, "");
  if (!digitsOnly) return NaN;

  // últimos 2 dígitos = centavos
  // exemplo: "123456" -> 1234.56
  const intPart = digitsOnly.slice(0, -2) || "0";
  const centsPart = digitsOnly.slice(-2);

  const normalized = `${intPart}.${centsPart}`; // "1234.56"
  return Number(normalized);
}

// Recebe só dígitos ("123456") e devolve string "R$ 1.234,56"
function formatDigitsAsBRL(digitsStr) {
  if (!digitsStr) {
    return "R$ 0,00";
  }

  // se tiver só 1 dígito ("5") -> "0,05"
  // se tiver só 2 dígitos ("50") -> "0,50"
  const intPart = digitsStr.slice(0, -2) || "0";
  const centsPart = digitsStr.slice(-2).padStart(2, "0");

  // monta número inteiro para poder usar Intl.NumberFormat
  const intNumber = Number(intPart);

  // formata parte inteira com separador de milhar
  const intFormatted = intNumber.toLocaleString("pt-BR");

  // junta parte inteira formatada + vírgula + centavos
  return `R$ ${intFormatted},${centsPart}`;
}

// pega um valor numérico (ex: 1234.56) e devolve "R$ 1.234,56"
export function formatNumberToBRL(valueNumber) {
  if (valueNumber == null || Number.isNaN(valueNumber)) {
    return "R$ 0,00";
  }

  // força duas casas decimais
  const fixed = Math.round(valueNumber * 100).toString(); // "123456"
  return formatDigitsAsBRL(fixed);
}

// ----------------------
// Máscara viva no input
// ----------------------

// Essa função "conecta" um <input> de dinheiro para:
//  - bloquear caracteres não numéricos
//  - sempre reescrever o valor no formato BRL
//  - manter o cursor no final
//
// IMPORTANTE: a abordagem é baseada em 'beforeinput' pra impedir que caracteres inválidos cheguem no campo.
// Você já usa algo assim no seu script atual.
export function attachCurrencyMask(inputEl) {
  // estado interno: apenas dígitos, sem vírgula e sem ponto, ex: "123456" = 1234,56
  let digitsState = "";

  // Inicialização: se já veio com algum valor no HTML, normaliza
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
    inputEl.value = formatDigitsAsBRL(digitsState);
    // garante cursor sempre no final
    requestAnimationFrame(() => {
      inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
    });
  }

  // Intercepta qualquer digitação ANTES de chegar no campo
  inputEl.addEventListener("beforeinput", (ev) => {
    const { inputType, data } = ev;

    if (inputType === "deleteContentBackward") {
      // backspace: remove último dígito
      digitsState = digitsState.slice(0, -1);
      syncInput();
      ev.preventDefault();
      return;
    }

    if (inputType === "insertText") {
      // só aceita número
      if (!/[0-9]/.test(data)) {
        ev.preventDefault();
        return;
      }

      // adiciona o dígito no final
      digitsState += data;
      // mata zeros à esquerda exagerados: "000123" vira "123"? NÃO obrigatoriamente.
      // mas se quiser limitar crescimento absurdo depois a gente trata
      syncInput();
      ev.preventDefault();
      return;
    }

    // Bloqueia qualquer outra modificação direta (colar texto, etc.)
    if (inputType === "insertFromPaste") {
      // cola: pega só dígitos do que colou
      const pasted = (ev.clipboardData || window.clipboardData)?.getData("text") || "";
      const only = pasted.replace(/\D/g, "");
      if (only) {
        digitsState += only;
      }
      syncInput();
      ev.preventDefault();
      return;
    }

    // Por segurança, bloqueia qualquer coisa que não lidamos explicitamente
    ev.preventDefault();
  });

  // Exponho um helper interno pro chamador conseguir ler o valor numérico atual
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
        // transforma número ex: 1234.56 -> "123456"
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

// ----------------------
// Leitura simples (uso rápido no submit)
// ----------------------

// Se você não quer guardar o controller retornado por attachCurrencyMask()
// e só quer ler pontualmente um input que já está mascarado em BRL,
// você pode usar isso no momento de validar/enviar:
export function getNumericValueFromCurrencyInput(inputEl) {
  return parseBRLToNumber(inputEl.value);
}
