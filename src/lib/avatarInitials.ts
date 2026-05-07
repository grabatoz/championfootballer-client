type InitialsInput = {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

const AVATAR_BG_PALETTE = [
  '#0EA5E9',
  '#06B6D4',
  '#14B8A6',
  '#10B981',
  '#22C55E',
  '#84CC16',
  '#F59E0B',
  '#F97316',
  '#EF4444',
  '#EC4899',
  '#A855F7',
  '#6366F1',
];

const normalize = (value: unknown): string => String(value ?? '').trim();

export const getAvatarInitials = ({ name, firstName, lastName }: InitialsInput): string => {
  const first = normalize(firstName);
  const last = normalize(lastName);

  if (first || last) {
    const left = first ? first[0] : (last ? last[0] : '');
    const right = last ? last[0] : (first.length > 1 ? first[1] : '');
    const combined = `${left}${right}`.toUpperCase();
    return combined || '?';
  }

  const fullName = normalize(name);
  if (!fullName) return '?';

  const words = fullName.split(/\s+/).filter(Boolean);
  const firstWord = words[0] || '';
  const lastWord = words.length > 1 ? words[words.length - 1] : '';
  const left = firstWord ? firstWord[0] : '';
  const right = lastWord
    ? lastWord[0]
    : (firstWord.length > 1 ? firstWord[1] : '');

  const combined = `${left}${right}`.toUpperCase();
  return combined || '?';
};

export const getAvatarBackgroundColor = (seed: string): string => {
  const input = normalize(seed) || 'player';
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return AVATAR_BG_PALETTE[hash % AVATAR_BG_PALETTE.length];
};
