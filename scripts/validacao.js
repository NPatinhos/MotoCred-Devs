export function somenteDigitos(str = "") {
  return str.replace(/\D+/g, "");
}

export function formatarBRL(valor) {
  if (isNaN(valor)) valor = 0;
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function parseMoeda(str = "") {
  if (!str) return 0;

  const apenasDigitos = str.replace(/[^\d]/g, ""); // fica "235000"
  const valor = Number(apenasDigitos) / 100; // vira 2350.00

  return isNaN(valor) ? 0 : valor;
}

export function mascaraCPF(input) {
  let v = somenteDigitos(input.value).slice(0, 11);

  if (v.length >= 3 && v.length <= 5) {
    v = v.replace(/(\d{3})(\d+)/, "$1.$2");
  } else if (v.length >= 6 && v.length <= 8) {
    v = v.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  } else if (v.length >= 9) {
    v = v.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4");
  }

  input.value = v;
}

export function cpfValido(cpfStr = "") {
  const cpf = somenteDigitos(cpfStr);

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // evita 111.111...

  // Cálculo dos DV
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
  let dv1 = 11 - (soma % 11);
  if (dv1 >= 10) dv1 = 0;

  if (dv1 !== Number(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i);
  let dv2 = 11 - (soma % 11);
  if (dv2 >= 10) dv2 = 0;

  return dv2 === Number(cpf[10]);
}

export function mascaraMoeda(input) {
  const apenasDigitos = somenteDigitos(input.value);
  const valor = Number(apenasDigitos) / 100;

  input.value = formatarBRL(valor);
}

export function sanitizarMoeda(input) {
  return parseMoeda(input.value);
}
