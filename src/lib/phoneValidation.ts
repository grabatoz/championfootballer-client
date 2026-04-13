import { Country } from "country-state-city";

export type PhoneDigitRule = {
  min: number;
  max: number;
  isoCode?: string;
  dialCode?: string;
  countryName?: string;
};

const FALLBACK_RULE: Pick<PhoneDigitRule, "min" | "max"> = { min: 6, max: 15 };

// Country-specific national number lengths (without country dialing code).
// Fallback is used for countries not listed here.
const PHONE_DIGIT_RULES_BY_ISO: Record<string, { min: number; max: number }> = {
  AE: { min: 9, max: 9 },
  AR: { min: 10, max: 10 },
  AT: { min: 10, max: 13 },
  AU: { min: 9, max: 9 },
  BE: { min: 9, max: 9 },
  BR: { min: 10, max: 11 },
  CA: { min: 10, max: 10 },
  CH: { min: 9, max: 9 },
  CN: { min: 11, max: 11 },
  DE: { min: 10, max: 11 },
  DK: { min: 8, max: 8 },
  ES: { min: 9, max: 9 },
  FI: { min: 9, max: 10 },
  FR: { min: 9, max: 9 },
  GB: { min: 10, max: 10 },
  IE: { min: 9, max: 9 },
  IN: { min: 10, max: 10 },
  IT: { min: 9, max: 10 },
  JP: { min: 10, max: 10 },
  KR: { min: 9, max: 10 },
  KW: { min: 8, max: 8 },
  MX: { min: 10, max: 10 },
  NG: { min: 10, max: 10 },
  NL: { min: 9, max: 9 },
  NO: { min: 8, max: 8 },
  PK: { min: 10, max: 10 },
  PT: { min: 9, max: 9 },
  QA: { min: 8, max: 8 },
  SA: { min: 9, max: 9 },
  SE: { min: 9, max: 9 },
  TR: { min: 10, max: 10 },
  US: { min: 10, max: 10 },
  ZA: { min: 9, max: 9 },
};

const ALL_COUNTRIES = Country.getAllCountries();

const COUNTRY_BY_ISO = new Map(
  ALL_COUNTRIES.map((country) => [country.isoCode.toUpperCase(), country] as const)
);

const COUNTRY_BY_NAME = new Map(
  ALL_COUNTRIES.map((country) => [country.name.trim().toLowerCase(), country] as const)
);

const COUNTRY_NAME_ALIASES: Record<string, string> = {
  uae: "united arab emirates",
  usa: "united states",
  uk: "united kingdom",
};

const getCountryByName = (countryName?: string | null) => {
  const raw = String(countryName || "").trim().toLowerCase();
  if (!raw) return undefined;

  const alias = COUNTRY_NAME_ALIASES[raw];
  if (alias && COUNTRY_BY_NAME.has(alias)) return COUNTRY_BY_NAME.get(alias);

  if (COUNTRY_BY_NAME.has(raw)) return COUNTRY_BY_NAME.get(raw);

  for (const [name, country] of COUNTRY_BY_NAME.entries()) {
    if (name.includes(raw) || raw.includes(name)) return country;
  }

  return undefined;
};

export const sanitizePhoneDigits = (value: string | number | null | undefined): string =>
  String(value ?? "").replace(/\D/g, "");

export const formatPhoneDigitRule = (rule: Pick<PhoneDigitRule, "min" | "max">): string =>
  rule.min === rule.max ? `${rule.min}` : `${rule.min}-${rule.max}`;

export const isPhoneDigitsValidForRule = (
  phoneDigits: string,
  rule: Pick<PhoneDigitRule, "min" | "max">
): boolean => {
  const len = sanitizePhoneDigits(phoneDigits).length;
  return len >= rule.min && len <= rule.max;
};

export const getPhoneDigitRuleByIsoCode = (isoCode?: string | null): PhoneDigitRule => {
  const normalizedIso = String(isoCode || "").trim().toUpperCase();
  const country = COUNTRY_BY_ISO.get(normalizedIso);
  const mapped = PHONE_DIGIT_RULES_BY_ISO[normalizedIso];

  const min = mapped?.min ?? FALLBACK_RULE.min;
  const max = mapped?.max ?? FALLBACK_RULE.max;
  const dialCode = country?.phonecode ? `+${country.phonecode}` : undefined;

  return {
    min,
    max,
    isoCode: normalizedIso || country?.isoCode,
    dialCode,
    countryName: country?.name,
  };
};

export const getPhoneDigitRuleByCountryName = (
  countryName?: string | null
): PhoneDigitRule => {
  const country = getCountryByName(countryName);
  if (!country) {
    return {
      ...FALLBACK_RULE,
      countryName: countryName ? String(countryName) : undefined,
    };
  }
  return getPhoneDigitRuleByIsoCode(country.isoCode);
};

