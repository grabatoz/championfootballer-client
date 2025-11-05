// Simple shadcn style calendar wrapper (React Day Picker)
'use client';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import type {
  DayPickerSingleProps,
  Matcher,
  ClassNames
} from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import './calendar.css';

// React Day Picker v8 type-safe props (remove problematic re-declarations)
interface CalendarProps extends Omit<DayPickerSingleProps, 'mode'> {
  month?: Date;
  onMonthChange?: (month: Date) => void;
  className?: string;

  // Explicit, strongly-typed (no any)
  disabled?: Matcher | Matcher[];
  modifiers?: Record<string, Matcher | Matcher[]>;
  modifiersClassNames?: Record<string, string>;
  classNames?: Partial<ClassNames>;
}

export function Calendar(props: CalendarProps) {
  return (
    <DayPicker
      mode="single"
      showOutsideDays
      {...props}
      disabled={
        props.disabled ?? { before: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
      modifiers={{
        ...(props.modifiers || {}),
        weekend: d => d.getDay() === 0 || d.getDay() === 6
      }}
      modifiersClassNames={{
        weekend: 'rdp-day-weekend',
        ...props.modifiersClassNames
      }}
      classNames={{
        ...props.classNames,
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
        day_disabled: 'cfp-rdp-day-disabled'
      }}
    />
  );
}