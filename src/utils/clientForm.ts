function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function unmaskPhone(value: string) {
  return onlyDigits(value).slice(0, 11);
}

export function formatPhone(value: string) {
  const digits = unmaskPhone(value);

  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function formatCurrencyBRL(value: number | string) {
  if (typeof value === "string") {
    const digits = onlyDigits(value);

    if (!digits) {
      return "";
    }

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(Number(digits) / 100);
  }

  const rawValue = Math.round(value * 100);

  const cents = Number.isFinite(rawValue) ? rawValue : 0;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(cents / 100);
}

export function parseCurrencyBRL(value: string) {
  const digits = onlyDigits(value);

  if (!digits) {
    return 0;
  }

  return Number(digits) / 100;
}
