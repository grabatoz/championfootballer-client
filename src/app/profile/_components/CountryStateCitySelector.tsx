'use client';

import { useState, useEffect } from 'react';
import { Grid, FormControl, MenuItem, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Country, State, City } from 'country-state-city';
import type { ICountry, IState, ICity } from 'country-state-city';

const themeColors = {
  primary: "#E56A16",
  border: "rgba(255,255,255,0.12)",
  text: "#ffffff",
  textDim: "rgba(255,255,255,0.72)",
};

const selectMenuProps = {
  anchorOrigin: { vertical: 'bottom', horizontal: 'left' } as const,
  transformOrigin: { vertical: 'top', horizontal: 'left' } as const,
  variant: 'menu' as const,
  marginThreshold: 0,
  PaperProps: {
    sx: {
      mt: 0,
      maxHeight: { xs: 240, sm: 320 },
      overflowY: 'auto',
      overscrollBehavior: 'contain',
      bgcolor: "#202225",
      color: themeColors.text,
      border: `1px solid ${themeColors.border}`,
    }
  }
};

const StyledTextField = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': {
    background: "#202225",
    color: themeColors.text,
    borderRadius: 10,
    border: `1px solid ${themeColors.border}`,
    transition: ".25s",
    '& fieldset': { borderColor: "transparent" },
    '&:hover': { borderColor: themeColors.primary },
    '&:hover fieldset': { borderColor: themeColors.primary },
    '&.Mui-focused': { borderColor: themeColors.primary },
    '&.Mui-focused fieldset': { borderColor: themeColors.primary },
    '&.Mui-disabled': {
      color: "#ffffff !important",
      opacity: "1 !important",
      WebkitTextFillColor: "#ffffff !important"
    },
    '& input, & textarea, & select': {
      color: themeColors.text,
      background: "transparent"
    },
    '& .MuiSelect-select': {
      color: "#ffffff !important",
      WebkitTextFillColor: "#ffffff !important",
    },
    '& .MuiSelect-select.Mui-disabled': {
      color: "#ffffff !important",
      WebkitTextFillColor: "#ffffff !important",
    },
    '& .MuiOutlinedInput-input.Mui-disabled': {
      color: "#ffffff !important",
      WebkitTextFillColor: "#ffffff !important",
    },
    minHeight: 44
  },
  '& .MuiOutlinedInput-input': {
    padding: '6px 12px',
    fontSize: '0.85rem',
    lineHeight: 1.2
  },
  '& .MuiInputLabel-root': { color: themeColors.textDim },
  '& .MuiInputLabel-root.Mui-focused': { color: themeColors.primary },
}));

interface Props {
  country: string;
  stateProvince: string;
  city: string;
  onCountryChange: (code: string, name: string) => void;
  onStateChange: (code: string, name: string) => void;
  onCityChange: (name: string) => void;
}

export default function CountryStateCitySelector({
  country,
  stateProvince,
  city,
  onCountryChange,
  onStateChange,
  onCityChange,
}: Props) {
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');
  const [selectedStateCode, setSelectedStateCode] = useState<string>('');

  const countries: ICountry[] = Country.getAllCountries() || [];
  const states: IState[] = selectedCountryCode ? (State.getStatesOfCountry(selectedCountryCode) || []) : [];
  const cities: ICity[] = selectedCountryCode
    ? ((selectedStateCode && (State.getStatesOfCountry(selectedCountryCode)?.length ?? 0) > 0)
        ? (City.getCitiesOfState(selectedCountryCode, selectedStateCode) || [])
        : (City.getCitiesOfCountry(selectedCountryCode) || []))
    : [];

  // Initialize from props
  useEffect(() => {
    if (country && !selectedCountryCode) {
      const foundCountry = countries.find(c => c.name.toLowerCase() === String(country).toLowerCase());
      if (foundCountry) {
        setSelectedCountryCode(foundCountry.isoCode);
      }
    }
  }, [country, selectedCountryCode, countries]);

  useEffect(() => {
    if (stateProvince && selectedCountryCode && !selectedStateCode) {
      const ss = State.getStatesOfCountry(selectedCountryCode);
      const foundState = ss.find(s => s.name.toLowerCase() === String(stateProvince).toLowerCase());
      if (foundState) {
        setSelectedStateCode(foundState.isoCode);
      }
    }
  }, [stateProvince, selectedCountryCode, selectedStateCode]);

  const handleCountryChange = (code: string) => {
    setSelectedCountryCode(code);
    const c = countries.find(c => c.isoCode === code);
    onCountryChange(code, c?.name || '');
    setSelectedStateCode('');
  };

  const handleStateChange = (code: string) => {
    setSelectedStateCode(code);
    const s = states.find(s => s.isoCode === code);
    onStateChange(code, s?.name || '');
  };

  return (
    <Grid container spacing={1}>
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth size="small">
          <StyledTextField
            size="small"
            select
            value={selectedCountryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            placeholder="Select a Country/Region"
            SelectProps={{ displayEmpty: true, MenuProps: selectMenuProps }}
          >
            <MenuItem value="" disabled>Select a Country/Region</MenuItem>
            {countries.map(c => (
              <MenuItem key={c.isoCode} value={c.isoCode}>{c.name}</MenuItem>
            ))}
          </StyledTextField>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth size="small" disabled={!selectedCountryCode || states.length === 0}>
          <StyledTextField
            size="small"
            select
            value={selectedStateCode}
            onChange={(e) => handleStateChange(e.target.value)}
            placeholder="Select a State"
            SelectProps={{ displayEmpty: true, MenuProps: selectMenuProps }}
          >
            <MenuItem value="" disabled>{states.length ? 'Select a State' : 'No states available'}</MenuItem>
            {states.map(s => (
              <MenuItem key={s.isoCode} value={s.isoCode}>{s.name}</MenuItem>
            ))}
          </StyledTextField>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth size="small" disabled={!selectedCountryCode || (!selectedStateCode && (cities?.length ?? 0) === 0)}>
          <StyledTextField
            size="small"
            select
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="Select a City/State"
            SelectProps={{ displayEmpty: true, MenuProps: selectMenuProps }}
          >
            <MenuItem value="" disabled>Select a City/State</MenuItem>
            {(cities ?? []).map(ci => (
              <MenuItem key={`${ci.name}-${ci.latitude}-${ci.longitude}`} value={ci.name}>{ci.name}</MenuItem>
            ))}
          </StyledTextField>
        </FormControl>
      </Grid>
    </Grid>
  );
}
