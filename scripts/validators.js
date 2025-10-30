// validators.js
// Funções puras de validação. Não mexem no DOM.
// Sempre retornam objetos padronizados para facilitar o uso.
// Padrões de retorno:
//   { ok: true, value: ... }                 // validação simples de 1 campo
//   { ok: false, error: "mensagem de erro" } // erro simples
//   { ok: true, values: {...} }              // validação de um grupo/etapa
//   { ok: false, fieldErrors: {campo:"msg"} } // erro por campo em um grupo

// ----------------------
// Utilidades internas
// ----------------------

// remove tudo que não é dígito
function onlyDigits(str) {
  return (str || "").replace(/\D/g, "");
}

// Algoritmo oficial de validação de CPF
// Recebe string só com dígitos
function isValidCpfAlgorithm(cpfDigits) {
  // tem que ter 11 dígitos
  if (cpfDigits.length !== 11) return false;

  // rejeita cpfs tipo "00000000000", "11111111111", etc
  if (/^(\d)\1+$/.test(cpfDigits)) return false;

  // cálculo do dígito verificador 1
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(cpfDigits[i], 10) * (10 - i);
  }
  const dv1 = (sum1 * 10) % 11 === 10 ? 0 : (sum1 * 10) % 11;

  if (dv1 !== parseInt(cpfDigits[9], 10)) return false;

  // cálculo do dígito verificador 2
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(cpfDigits[i], 10) * (11 - i);
  }
  const dv2 = (sum2 * 10) % 11 === 10 ? 0 : (sum2 * 10) % 11;

  if (dv2 !== parseInt(cpfDigits[10], 10)) return false;

  return true;
}

// ----------------------
// Validações de campos individuais
// ----------------------

export function validateTipoUsuario(tipoUsuarioValue) {
  // esperado: "comprador" ou "vendedor"
  const v = (tipoUsuarioValue || "").toLowerCase().trim();
  if (v !== "comprador" && v !== "vendedor") {
    return { ok: false, error: "Selecione se você é comprador ou vendedor." };
  }
  return { ok: true, value: v }; // "comprador" | "vendedor"
}

export function validateCNH(possuiCNHValue) {
  // esperado: "sim" | "nao"
  const v = (possuiCNHValue || "").toLowerCase().trim();
  if (v !== "sim" && v !== "nao") {
    return { ok: false, error: "Informe se possui CNH." };
  }
  return { ok: true, value: v === "sim" }; // true / false
}

export function validateCPF(cpfInputValue) {
  const digits = onlyDigits(cpfInputValue);

  if (!digits) {
    return { ok: false, error: "CPF obrigatório." };
  }

  if (digits.length !== 11) {
    return { ok: false, error: "CPF deve ter 11 dígitos." };
  }

  if (!isValidCpfAlgorithm(digits)) {
    return { ok: false, error: "CPF inválido." };
  }

  return { ok: true, value: digits }; // devolve CPF limpo só com números
}

export function validateNomeObrigatorio(nomeValue, label = "Nome") {
  const v = (nomeValue || "").trim();
  if (!v) {
    return { ok: false, error: `${label} obrigatório.` };
  }
  return { ok: true, value: v };
}

export function validateEmail(emailValue) {
  const v = (emailValue || "").trim();

  if (!v) {
    return { ok: false, error: "E-mail obrigatório." };
  }

  // Regex simples pra formato nome@dominio.ext
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(v)) {
    return { ok: false, error: "E-mail inválido." };
  }

  return { ok: true, value: v.toLowerCase() };
}

export function validateTelefone(telefoneValue) {
  const digits = onlyDigits(telefoneValue);

  if (!digits) {
    return { ok: false, error: "Telefone obrigatório." };
  }

  // Brasil comum: 10 ou 11 dígitos (com/sem nono dígito)
  if (digits.length < 10 || digits.length > 11) {
    return { ok: false, error: "Telefone inválido." };
  }

  return { ok: true, value: digits };
}

// Campos numéricos (renda mensal, valor moto, etc.)
// Esses valores devem chegar já como Number (ex: 1234.56)
// Se você ainda estiver com string "R$ 1.234,56", primeiro passa em moneyMask.numFromInput()
export function validateValorPositivo(valorNumber, label = "Valor") {
  if (valorNumber == null || Number.isNaN(valorNumber)) {
    return { ok: false, error: `${label} obrigatório.` };
  }

  if (valorNumber <= 0) {
    return { ok: false, error: `${label} deve ser maior que zero.` };
  }

  return { ok: true, value: valorNumber };
}

// Ex: validar se entrada <= valor da moto
export function validateEntradaVsTotal(valorMotoNumber, entradaNumber) {
  if (entradaNumber > valorMotoNumber) {
    return {
      ok: false,
      error: "A entrada não pode ser maior que o valor total da moto.",
    };
  }
  return { ok: true, value: { valorMoto: valorMotoNumber, entrada: entradaNumber } };
}

// ----------------------
// Validações de grupos / etapas inteiras
// ----------------------

// Etapa 1: identificação do tipo de usuário, etc.
// Ajuste conforme seu HTML final
export function validateEtapaIdentificacao({ tipoUsuarioRaw }) {
  const errors = {};
  const clean = {};

  const rTipo = validateTipoUsuario(tipoUsuarioRaw);
  if (!rTipo.ok) {
    errors.tipoUsuario = rTipo.error;
  } else {
    clean.tipoUsuario = rTipo.value; // "comprador" | "vendedor"
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, fieldErrors: errors };
  }

  return { ok: true, values: clean };
}

// Etapa 2: dados do vendedor
// Só será exigida se tipoUsuario === "vendedor". Se for "comprador", você pode nem chamar isso.
export function validateEtapaVendedor({ lojaRaw, nomeVendedorRaw, emailVendedorRaw }) {
  const errors = {};
  const clean = {};

  // loja
  {
    const loja = (lojaRaw || "").trim();
    if (!loja) {
      errors.loja = "Informe a loja.";
    } else {
      clean.loja = loja;
    }
  }

  // nome vendedor
  {
    const rNome = validateNomeObrigatorio(nomeVendedorRaw, "Nome do vendedor");
    if (!rNome.ok) {
      errors.nomeVendedor = rNome.error;
    } else {
      clean.nomeVendedor = rNome.value;
    }
  }

  // email vendedor
  {
    const rEmail = validateEmail(emailVendedorRaw);
    if (!rEmail.ok) {
      errors.emailVendedor = rEmail.error;
    } else {
      clean.emailVendedor = rEmail.value;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, fieldErrors: errors };
  }

  return { ok: true, values: clean };
}

// Etapa 3: dados do cliente
export function validateEtapaCliente({
  nomeClienteRaw,
  cpfRaw,
  cnhRaw,          // esperado "sim"/"nao"
  emailClienteRaw,
  telefoneRaw,
}) {
  const errors = {};
  const clean = {};

  // nome cliente
  {
    const rNome = validateNomeObrigatorio(nomeClienteRaw, "Nome do cliente");
    if (!rNome.ok) {
      errors.nomeCliente = rNome.error;
    } else {
      clean.nomeCliente = rNome.value;
    }
  }

  // cpf cliente
  {
    const rCpf = validateCPF(cpfRaw);
    if (!rCpf.ok) {
      errors.cpf = rCpf.error;
    } else {
      clean.cpf = rCpf.value; // só dígitos
    }
  }

  // cnh sim/nao
  {
    const rCnh = validateCNH(cnhRaw);
    if (!rCnh.ok) {
      errors.cnh = rCnh.error;
    } else {
      clean.possuiCNH = rCnh.value; // boolean
    }
  }

  // email cliente
  {
    const rEmail = validateEmail(emailClienteRaw);
    if (!rEmail.ok) {
      errors.emailCliente = rEmail.error;
    } else {
      clean.emailCliente = rEmail.value;
    }
  }

  // telefone cliente
  {
    const rTel = validateTelefone(telefoneRaw);
    if (!rTel.ok) {
      errors.telefoneCliente = rTel.error;
    } else {
      clean.telefoneCliente = rTel.value; // só dígitos
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, fieldErrors: errors };
  }

  return { ok: true, values: clean };
}

// Etapa 4: dados da venda (valores R$ e renda)
// Aqui a gente assume que você já converteu os campos "R$ 12.345,67" em Number
export function validateEtapaVenda({
  rendaMensalNumber,
  valorMotoNumber,
  valorEntradaNumber,
}) {
  const errors = {};
  const clean = {};

  // renda mensal
  {
    const rRenda = validateValorPositivo(rendaMensalNumber, "Renda mensal");
    if (!rRenda.ok) {
      errors.rendaMensal = rRenda.error;
    } else {
      clean.rendaMensal = rRenda.value;
    }
  }

  // valor moto
  {
    const rMoto = validateValorPositivo(valorMotoNumber, "Valor da moto");
    if (!rMoto.ok) {
      errors.valorMoto = rMoto.error;
    } else {
      clean.valorMoto = rMoto.value;
    }
  }

  // valor entrada
  {
    const rEntrada = validateValorPositivo(valorEntradaNumber, "Valor de entrada");
    if (!rEntrada.ok) {
      errors.valorEntrada = rEntrada.error;
    } else {
      clean.valorEntrada = rEntrada.value;
    }
  }

  // relação entrada vs total
  {
    const rRelacao = validateEntradaVsTotal(
      valorMotoNumber,
      valorEntradaNumber
    );
    if (!rRelacao.ok) {
      errors.valorEntrada = rRelacao.error;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, fieldErrors: errors };
  }

  // nota: se chegou aqui, já temos clean.rendaMensal, clean.valorMoto, clean.valorEntrada
  return { ok: true, values: clean };
}
