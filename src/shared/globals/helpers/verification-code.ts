import crypto from 'crypto';

const INVITE_CODE_LENGTH = 7;

export function generateReadableCode(length = INVITE_CODE_LENGTH) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijklmnopqrstuvwxyz';
  let code = '';
  for (let i = 0; i < length; i++) {
    const idx = crypto.randomInt(0, alphabet.length);
    code += alphabet[idx];
  }
  return code;
}
