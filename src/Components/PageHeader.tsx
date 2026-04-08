import React from 'react';
import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';

type SxArrayItem =
  | SystemStyleObject<Theme>
  | ((theme: Theme) => SystemStyleObject<Theme>)
  | boolean;

const toSxArray = (value?: SxProps<Theme>): SxArrayItem[] => {
  if (!value) return [];
  return Array.isArray(value) ? (value as SxArrayItem[]) : [value as SxArrayItem];
};

type PageHeaderProps = {
  title: string;
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
  titleSx?: SxProps<Theme>;
  dividerSx?: SxProps<Theme>;
  fullBleed?: boolean;
};

const baseHeaderSx: SystemStyleObject<Theme> = {
  mb: { xs: 3, md: 5 },
  bgcolor: 'black',
  p: { xs: 2, md: 3 },
};

const baseTitleSx: SystemStyleObject<Theme> = {
  color: 'white',
  fontFamily: '"Oswald", sans-serif !important',
  fontWeight: 700,
  fontSize: { xs: '32px', sm: '42px', md: '55px' },
  lineHeight: 1.1,
  textAlign: 'center',
  textTransform: 'uppercase',
  letterSpacing: '0px',
  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  pt: { xs: 1, md: 2 },
  pb: { xs: 3, md: 6 },
};

const baseDividerSx: SystemStyleObject<Theme> = {
  width: '100%',
  marginLeft: 0,
  marginRight: 0,
  height: 'var(--header-divider-height)',
  background: 'var(--header-divider-color)',
  mb: { xs: 2, md: 2 },
};

export default function PageHeader({
  title,
  children,
  sx,
  titleSx,
  dividerSx,
  fullBleed = true,
}: PageHeaderProps) {
  const fullBleedSx: SystemStyleObject<Theme> = fullBleed
    ? {
        width: '100vw',
        position: 'relative',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        mx: 0,
      }
    : {};
  const dividerBaseSx: SystemStyleObject<Theme> = fullBleed
    ? {
        width: 'auto',
        mx: { xs: -2, sm: -3, md: -3 },
        height: 'var(--header-divider-height)',
        background: 'var(--header-divider-color)',
        mb: { xs: 2, md: 2 },
      }
    : baseDividerSx;
  const headerSx: SxProps<Theme> = [baseHeaderSx, fullBleedSx, ...toSxArray(sx)];
  const headerTitleSx: SxProps<Theme> = [baseTitleSx, ...toSxArray(titleSx)];
  const headerDividerSx: SxProps<Theme> = [dividerBaseSx, ...toSxArray(dividerSx)];
  return (
    <Box sx={headerSx}>
      <Typography variant="h3" sx={headerTitleSx}>
        {title}
      </Typography>
      <Box sx={headerDividerSx} />
      {children}
    </Box>
  );
}
