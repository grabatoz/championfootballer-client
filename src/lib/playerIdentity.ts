type PlayerIdentityLike = {
  id?: unknown;
  userId?: unknown;
  _id?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  name?: unknown;
  email?: unknown;
  provider?: unknown;
  isGuest?: unknown;
  guestId?: unknown;
  type?: unknown;
  role?: unknown;
};

const text = (value: unknown): string => String(value ?? '').trim();
const lower = (value: unknown): string => text(value).toLowerCase();

export const isGuestPlayerRecord = (player: unknown): boolean => {
  if (!player || typeof player !== 'object') return false;
  const record = player as PlayerIdentityLike;
  const id = lower(record.id ?? record.userId ?? record._id);
  const firstName = lower(record.firstName);
  const lastName = lower(record.lastName);
  const fullName = lower(record.name);
  const email = lower(record.email);
  const provider = lower(record.provider);
  const type = lower(record.type);
  const role = lower(record.role);
  const isMigratedGuestEmail =
    email.endsWith('@local.invalid') ||
    (email.startsWith('migrated+') && email.includes('@local.invalid'));

  return (
    record.isGuest === true ||
    text(record.guestId) !== '' ||
    id.startsWith('guest-') ||
    id.startsWith('guest_') ||
    provider === 'guest' ||
    type === 'guest' ||
    role === 'guest' ||
    lastName === 'guest' ||
    firstName === 'guest' ||
    fullName === 'guest' ||
    email.includes('guest') ||
    isMigratedGuestEmail
  );
};

export const isRegisteredPlayerRecord = (player: unknown): boolean => {
  if (!player || typeof player !== 'object') return false;
  const record = player as PlayerIdentityLike;
  if (isGuestPlayerRecord(record)) return false;

  if ('email' in record) {
    const email = text(record.email);
    if (!email) return false;
  }

  return true;
};
