export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidCpf(value: string) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  const digits = cpf.split("").map(Number);
  const first = digits.slice(0, 9).reduce((sum, digit, index) => sum + digit * (10 - index), 0);
  const firstCheck = first % 11 < 2 ? 0 : 11 - (first % 11);
  const second = digits.slice(0, 10).reduce((sum, digit, index) => sum + digit * (11 - index), 0);
  const secondCheck = second % 11 < 2 ? 0 : 11 - (second % 11);

  return digits[9] === firstCheck && digits[10] === secondCheck;
}

export function isValidCnpj(value: string) {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

  const calc = (base: string, factors: number[]) => {
    const total = base.split("").reduce((sum, digit, index) => sum + Number(digit) * factors[index], 0);
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const first = calc(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calc(cnpj.slice(0, 12) + first, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return Number(cnpj[12]) === first && Number(cnpj[13]) === second;
}

export function isValidBrazilianPhone(value: string) {
  const phone = onlyDigits(value);
  return phone.length === 10 || phone.length === 11;
}

export function ageFromBirthDate(value: string) {
  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return age;
}
