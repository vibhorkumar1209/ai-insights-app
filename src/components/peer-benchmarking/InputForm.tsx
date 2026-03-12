'use client';

import { useState } from 'react';
import { BenchmarkFormData } from '@/lib/types';

interface InputFormProps {
  onSubmit: (data: BenchmarkFormData) => void;
  loading: boolean;
}

const fieldStyle = {
  width: '100%',
  background: 'rgba(8,15,22,0.8)',
  border: '1px solid #1e4a68',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#E8EDF5',
  fontSize: 13,
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.2s',
};

function Field({
  label,
  required,
  name,
  value,
  onChange,
  placeholder,
  textarea,
  hint,
}: {
  label: string;
  required?: boolean;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  textarea?: boolean;
  hint?: string;
}) {
  const [focused, setFocused] = useState(false);

  const inputProps = {
    id: name,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    placeholder,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      ...fieldStyle,
      borderColor: focused ? '#3491E8' : '#1e4a68',
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={name} style={{ fontSize: 12, fontWeight: 700, color: '#7eaabf', letterSpacing: 0.8 }}>
        {label.toUpperCase()}
        {required && <span style={{ color: '#E63946', marginLeft: 4 }}>*</span>}
      </label>
      {textarea ? (
        <textarea {...inputProps} rows={3} style={{ ...inputProps.style, resize: 'vertical' }} />
      ) : (
        <input type="text" {...inputProps} />
      )}
      {hint && <div style={{ fontSize: 11, color: '#4a7a96', lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

export default function InputForm({ onSubmit, loading }: InputFormProps) {
  const [form, setForm] = useState<BenchmarkFormData>({
    userOrganization: '',
    targetCompany: '',
    industryContext: '',
    focusAreas: '',
    solutionPortfolio: '',
    additionalContext: '',
  });

  const set = (key: keyof BenchmarkFormData) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const valid =
    form.userOrganization.trim() &&
    form.targetCompany.trim() &&
    form.industryContext.trim();

  return (
    <div style={{
      background: 'linear-gradient(160deg, #132d40, #0f2535)',
      border: '1px solid #1e4a68',
      borderRadius: 12,
      padding: 28,
    }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#3491E8', letterSpacing: 2, marginBottom: 6 }}>
          STEP 1 OF 3
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#E8EDF5' }}>Configure Analysis</div>
        <div style={{ fontSize: 13, color: '#7eaabf', marginTop: 4 }}>
          Define your organization, target company, and analysis context.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Required */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field
            label="Your Organization"
            required
            name="userOrganization"
            value={form.userOrganization}
            onChange={set('userOrganization')}
            placeholder="e.g. EdgeVerve, Salesforce"
            hint="The selling/sponsoring organization"
          />
          <Field
            label="Target Company"
            required
            name="targetCompany"
            value={form.targetCompany}
            onChange={set('targetCompany')}
            placeholder="e.g. Incora, Maersk, Caterpillar"
            hint="The account you are targeting"
          />
        </div>

        <Field
          label="Industry Context"
          required
          name="industryContext"
          value={form.industryContext}
          onChange={set('industryContext')}
          placeholder="e.g. Aerospace supply chain distribution"
          hint="Brief descriptor to identify relevant peers and frame the analysis"
        />

        <Field
          label="Focus Areas"
          name="focusAreas"
          value={form.focusAreas}
          onChange={set('focusAreas')}
          placeholder="e.g. Sustainability tech, Cybersecurity posture, Cloud migration"
          hint="Optional: specific dimensions beyond the default 5 to benchmark"
        />

        <Field
          label="Solution Portfolio"
          name="solutionPortfolio"
          value={form.solutionPortfolio}
          onChange={set('solutionPortfolio')}
          placeholder="e.g. AI Next, AssistEdge RPA, XtractEdge, TradeEdge"
          hint="Optional: products/platforms to map against identified gaps"
        />

        <Field
          label="Additional Context"
          name="additionalContext"
          value={form.additionalContext}
          onChange={set('additionalContext')}
          placeholder="e.g. Emerged from Ch.11 Jan 2025, runs SAP/Oracle, 644K SKUs..."
          textarea
          hint="Optional: known intelligence about the target account"
        />

        <button
          onClick={() => onSubmit(form)}
          disabled={!valid || loading}
          style={{
            background: valid && !loading
              ? 'linear-gradient(135deg, #0e4560, #3491E8)'
              : 'rgba(30,74,104,0.4)',
            color: valid && !loading ? '#fff' : '#4a7a96',
            border: 'none',
            borderRadius: 8,
            padding: '12px 28px',
            fontSize: 14,
            fontWeight: 700,
            cursor: valid && !loading ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            marginTop: 4,
          }}
        >
          {loading ? 'Discovering competitors...' : 'Discover Competitors →'}
        </button>
      </div>
    </div>
  );
}
