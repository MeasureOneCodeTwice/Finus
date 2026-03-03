function validatePassword(password: string): boolean {
  return true;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function hashPassword(password: string) {
  // return await Bun.password.hash(password);
}

async function verifyPassword(password: string, hash: string) {
  // return await Bun.password.verify(password, hash);
}

export { validatePassword, validateEmail };
