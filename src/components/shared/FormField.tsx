'use client';

import React from 'react';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/lib/styleConstants';

interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  minRows?: number;
  maxLength?: number;
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: TYPOGRAPHY.size_sm,
  fontWeight: TYPOGRAPHY.weight_extrabold,
  color: COLORS.textMuted,
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  marginBottom: SPACING.sm,
  marginTop: SPACING.lg,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: SPACING.p_md_lg,
  background: 'rgba(8,15,22,0.8)',
  border: `1px solid ${COLORS.headerLight}`,
  borderRadius: BORDER_RADIUS.md,
  color: COLORS.textLight,
  fontSize: TYPOGRAPHY.size_lg,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: '0.2s ease',
};

const inputFocusStyle: React.CSSProperties = {
  ...inputStyle,
  borderColor: COLORS.accentBlue,
  boxShadow: `0 0 0 2px rgba(52, 145, 232, 0.1)`,
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '80px',
  lineHeight: 1.5,
};

const errorStyle: React.CSSProperties = {
  fontSize: TYPOGRAPHY.size_sm,
  color: COLORS.accentRed,
  marginTop: SPACING.xs,
};

export default function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  error,
  minRows,
  maxLength,
}: FormFieldProps) {
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  if (type === 'textarea') {
    return (
      <div>
        <label htmlFor={name} style={labelStyle}>
          {label}
          {required && ' *'}
        </label>
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          style={isFocused ? { ...textareaStyle, ...inputFocusStyle } : textareaStyle}
          maxLength={maxLength}
          rows={minRows || 4}
        />
        {error && <div style={errorStyle}>{error}</div>}
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={name} style={labelStyle}>
        {label}
        {required && ' *'}
      </label>
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        style={isFocused ? { ...inputStyle, ...inputFocusStyle } : inputStyle}
      />
      {error && <div style={errorStyle}>{error}</div>}
    </div>
  );
}
