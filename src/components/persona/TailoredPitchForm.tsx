'use client';

import { useState } from 'react';

interface TailoredPitchFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

interface FormData {
  // About You
  yourName: string;
  yourTitle: string;
  yourCompany: string;
  yourOffering: string;
  targetAudience: string;

  // About Target
  targetName: string;
  targetTitle: string;
  targetCompany: string;
  targetIndustry: string;
  targetPainPoints: string;
  targetRecentNews: string;

  // Case Study
  caseStudyCompany: string;
  caseStudyIndustry: string;
  caseStudyProblem: string;
  caseStudySolution: string;
  caseStudyMetrics: string;
  caseStudyOutcome: string;
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7280',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  marginBottom: 8,
  marginTop: 14,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#FFFFFF',
  border: '1px solid #CCDFEA',
  borderRadius: 8,
  color: '#1B2A3D',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: 80,
  lineHeight: 1.5,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#3491E8',
  marginBottom: 16,
  marginTop: 0,
  paddingBottom: 12,
  borderBottom: '1px solid rgba(34,211,238,0.2)',
};

export default function TailoredPitchForm({ onSubmit, isLoading }: TailoredPitchFormProps) {
  const [formData, setFormData] = useState<FormData>({
    yourName: '',
    yourTitle: '',
    yourCompany: '',
    yourOffering: '',
    targetAudience: '',
    targetName: '',
    targetTitle: '',
    targetCompany: '',
    targetIndustry: '',
    targetPainPoints: '',
    targetRecentNews: '',
    caseStudyCompany: '',
    caseStudyIndustry: '',
    caseStudyProblem: '',
    caseStudySolution: '',
    caseStudyMetrics: '',
    caseStudyOutcome: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isFormValid = formData.yourName && formData.yourCompany && formData.targetName &&
    formData.targetCompany && formData.caseStudyCompany && formData.caseStudyMetrics;

  return (
    <form onSubmit={handleSubmit}>
      <div style={{
        background: 'linear-gradient(135deg, #0c3649, #12516E)',
        border: '1px solid #CCDFEA',
        borderRadius: 12,
        padding: '32px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#3491E8', textTransform: 'uppercase' as const, marginBottom: 8 }}>
            TAILORED SALES PITCH
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#E2E8F0', margin: '0 0 12px 0' }}>
            Generate High-Conversion Outreach
          </h2>
          <p style={{ fontSize: 13, color: '#5A6E7A', margin: 0 }}>
            Provide your information, target executive details, and a case study to generate personalized LinkedIn message, email, and pitch script.
          </p>
        </div>

        {/* SECTION 1: About You */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={sectionTitleStyle}>About You</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Your Name *</label>
              <input type="text" name="yourName" value={formData.yourName} onChange={handleChange} placeholder="e.g. Sarah Chen" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Your Title *</label>
              <input type="text" name="yourTitle" value={formData.yourTitle} onChange={handleChange} placeholder="e.g. VP Sales Engineering" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Your Company *</label>
              <input type="text" name="yourCompany" value={formData.yourCompany} onChange={handleChange} placeholder="e.g. Acme Solutions" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Target Audience</label>
              <input type="text" name="targetAudience" value={formData.targetAudience} onChange={handleChange} placeholder="e.g. Enterprise SaaS leaders" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>What You Offer *</label>
            <textarea name="yourOffering" value={formData.yourOffering} onChange={handleChange} placeholder="Describe your solution briefly. Focus on business outcomes, not features." style={textareaStyle} />
          </div>
        </div>

        {/* SECTION 2: About Target */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={sectionTitleStyle}>About Target Executive</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Target Name *</label>
              <input type="text" name="targetName" value={formData.targetName} onChange={handleChange} placeholder="e.g. John Smith" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Target Title *</label>
              <input type="text" name="targetTitle" value={formData.targetTitle} onChange={handleChange} placeholder="e.g. Chief Technology Officer" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Target Company *</label>
              <input type="text" name="targetCompany" value={formData.targetCompany} onChange={handleChange} placeholder="e.g. TechCorp Inc" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Target Industry</label>
              <input type="text" name="targetIndustry" value={formData.targetIndustry} onChange={handleChange} placeholder="e.g. Financial Services" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Known Pain Points or Challenges</label>
            <textarea name="targetPainPoints" value={formData.targetPainPoints} onChange={handleChange} placeholder="What challenges is this executive likely facing? (Optional but improves personalization)" style={textareaStyle} />
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Recent News or LinkedIn Activity (Optional)</label>
            <textarea name="targetRecentNews" value={formData.targetRecentNews} onChange={handleChange} placeholder="Recent company news, promotions, or initiatives that might be relevant" style={textareaStyle} />
          </div>
        </div>

        {/* SECTION 3: Case Study */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={sectionTitleStyle}>Case Study / Proof Point</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Case Study Company *</label>
              <input type="text" name="caseStudyCompany" value={formData.caseStudyCompany} onChange={handleChange} placeholder="e.g. Fortune 500 Tech Company" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Industry</label>
              <input type="text" name="caseStudyIndustry" value={formData.caseStudyIndustry} onChange={handleChange} placeholder="e.g. Technology" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>The Problem They Faced</label>
            <textarea name="caseStudyProblem" value={formData.caseStudyProblem} onChange={handleChange} placeholder="What was the business challenge?" style={textareaStyle} />
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Your Solution</label>
            <textarea name="caseStudySolution" value={formData.caseStudySolution} onChange={handleChange} placeholder="How did you help them solve it?" style={textareaStyle} />
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Key Metrics / Results *</label>
            <textarea name="caseStudyMetrics" value={formData.caseStudyMetrics} onChange={handleChange} placeholder="e.g. 45% reduction in time-to-market, $2.3M annual savings, 3x ROI in first year" style={textareaStyle} />
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Outcome / Business Impact</label>
            <textarea name="caseStudyOutcome" value={formData.caseStudyOutcome} onChange={handleChange} placeholder="What was the strategic or operational impact?" style={textareaStyle} />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          style={{
            width: '100%',
            padding: '14px 24px',
            borderRadius: 8,
            border: 'none',
            background: isFormValid ? 'linear-gradient(135deg, #3491E8, #2563EB)' : 'rgba(30,74,104,0.4)',
            color: isFormValid ? '#fff' : '#4A6A7D',
            fontSize: 14,
            fontWeight: 600,
            cursor: isFormValid ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
            marginTop: 24,
          }}
          onMouseEnter={(e) => {
            if (isFormValid) e.currentTarget.style.background = 'linear-gradient(135deg, #2563EB, #1d4ed8)';
          }}
          onMouseLeave={(e) => {
            if (isFormValid) e.currentTarget.style.background = 'linear-gradient(135deg, #3491E8, #2563EB)';
          }}
        >
          {isLoading ? '🔄 Generating Pitch...' : '✨ Generate Tailored Pitch'}
        </button>

        {!isFormValid && (
          <p style={{ fontSize: 12, color: '#5A6E7A', marginTop: 12, textAlign: 'center' }}>
            Fill in all required fields to generate your pitch
          </p>
        )}
      </div>
    </form>
  );
}
