// Simple shadcn style calendar wrapper (React Day Picker)
'use client';
import * as React from 'react';
import { DayPicker, DayPickerSingleProps } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import './calendar.css';

// Extend props to include controlled month + disabled etc. (some versions' types omit these)
interface CalendarProps extends Omit<DayPickerSingleProps, 'mode'> {
  month?: Date;
  onMonthChange?: (month: Date) => void;
  className?: string;
  // fallback for any future DayPicker props not in local types
  [key: string]: any;
}

export function Calendar(props: CalendarProps) {
  return (
    <DayPicker
      mode="single"
      showOutsideDays
      {...props}
      disabled={props.disabled ?? { before: new Date(new Date().setHours(0,0,0,0)) }}
      modifiers={{
        ...(props.modifiers || {}),
        weekend: (d) => d.getDay() === 0 || d.getDay() === 6
      }}
      modifiersClassNames={{
        weekend: 'rdp-day-weekend',
        ...props.modifiersClassNames
      }}
      classNames={{
        root: 'cfp-rdp-root',
        months: 'cfp-rdp-months',
        month: 'cfp-rdp-month',
        caption: 'cfp-rdp-caption',
        caption_label: 'cfp-rdp-caption-label',
        nav: 'cfp-rdp-nav',
        nav_button: 'cfp-rdp-nav-btn',
        head: 'cfp-rdp-head',
        head_row: 'cfp-rdp-head-row',
        head_cell: 'cfp-rdp-head-cell',
        table: 'cfp-rdp-table',
        row: 'cfp-rdp-row',
        cell: 'cfp-rdp-cell',
        day: 'cfp-rdp-day',
        day_today: 'cfp-rdp-day-today',
        day_selected: 'cfp-rdp-day-selected',
        day_outside: 'cfp-rdp-day-outside',
        day_disabled: 'cfp-rdp-day-disabled',
        ...props.classNames
      }}
    />
  );
}