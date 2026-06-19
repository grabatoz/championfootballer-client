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

export const getPositionShortForm = (position: unknown): string => {
  if (!position) return '-';
  const pos = String(position).trim();
  if (!pos) return '-';

  // First try to extract from parentheses, e.g. "Right-Back (RB)" -> "RB"
  const match = pos.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    return match[1].trim();
  }

  // Common position mappings
  const positionMap: Record<string, string> = {
    'center-back': 'CB',
    'right-back': 'RB',
    'left-back': 'LB',
    'right wing-back': 'RWB',
    'left wing-back': 'LWB',
    'central midfielder': 'CM',
    'defensive midfielder': 'CDM',
    'attacking midfielder': 'CAM',
    'right midfielder': 'RM',
    'left midfielder': 'LM',
    'striker': 'ST',
    'center forward': 'CF',
    'right forward': 'RF',
    'left forward': 'LF',
    'right winger': 'RW',
    'left winger': 'LW',
    'goalkeeper': 'GK',
    'cb': 'CB',
    'rb': 'RB',
    'lb': 'LB',
    'rwb': 'RWB',
    'lwb': 'LWB',
    'cm': 'CM',
    'cdm': 'CDM',
    'cam': 'CAM',
    'rm': 'RM',
    'lm': 'LM',
    'st': 'ST',
    'cf': 'CF',
    'rf': 'RF',
    'lf': 'LF',
    'rw': 'RW',
    'lw': 'LW',
    'gk': 'GK',
  };

  const lower = pos.toLowerCase();
  if (positionMap[lower]) {
    return positionMap[lower];
  }

  // Handle substring matches
  if (lower.includes('goalkeeper')) return 'GK';
  if (lower.includes('center-back')) return 'CB';
  if (lower.includes('right-back')) return 'RB';
  if (lower.includes('left-back')) return 'LB';
  if (lower.includes('wing-back')) {
    if (lower.includes('right')) return 'RWB';
    if (lower.includes('left')) return 'LWB';
    return 'WB';
  }
  if (lower.includes('midfielder')) {
    if (lower.includes('defensive')) return 'CDM';
    if (lower.includes('attacking')) return 'CAM';
    if (lower.includes('central')) return 'CM';
    if (lower.includes('right')) return 'RM';
    if (lower.includes('left')) return 'LM';
    return 'MF';
  }
  if (lower.includes('winger')) {
    if (lower.includes('right')) return 'RW';
    if (lower.includes('left')) return 'LW';
    return 'WG';
  }
  if (lower.includes('striker')) return 'ST';
  if (lower.includes('forward')) {
    if (lower.includes('center')) return 'CF';
    if (lower.includes('right')) return 'RF';
    if (lower.includes('left')) return 'LF';
    return 'FW';
  }

  return pos.toUpperCase().substring(0, 3);
};

