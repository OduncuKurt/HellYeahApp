/**
 * Benzersiz invite code oluşturur
 * Format: BEER-XXXX (örn: BEER-2A5X)
 */
export const generateInviteCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }

  return `BEER-${code}`;
};

/**
 * Invite code'u validate eder
 */
export const validateInviteCode = (code: string): boolean => {
  // Format: BEER-XXXX (4 karakter, harf veya sayı)
  const regex = /^BEER-[A-Z0-9]{4}$/;
  return regex.test(code.toUpperCase());
};

/**
 * Invite code'u normalize eder (büyük harfe çevirir)
 */
export const normalizeInviteCode = (code: string): string => {
  return code.toUpperCase().trim();
};

/**
 * Invite link oluşturur
 */
export const generateInviteLink = (inviteCode: string): string => {
  // Deep link URL
  return `hellyeahapp://invite/${inviteCode}`;
};

/**
 * WhatsApp paylaşım linki oluşturur
 */
export const generateWhatsAppInviteMessage = (
  groupName: string,
  inviteCode: string
): string => {
  const message = `🍺 Hell Yeah! "${groupName}" grubuna katıl!\n\nDavet Kodu: ${inviteCode}\n\nUygulamayı aç ve kodu gir!`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};
