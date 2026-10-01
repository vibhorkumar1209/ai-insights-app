import type { KeyPlayerProfile, ReportSection } from '@ai-insights/types';

/**
 * Key player profiles for an Industry Report section.
 *
 * The API field was renamed from `competitorProfiles` to `keyPlayerProfiles`,
 * since these are the industry's key players rather than any one company's
 * competitors. Reports saved to Report History before the rename still carry
 * the old name, so it is read as a fallback — one place, used by the on-screen
 * card and every export format, so they cannot disagree.
 */
export function keyPlayerProfilesOf(section: ReportSection): KeyPlayerProfile[] {
  const current = section.keyPlayerProfiles;
  if (Array.isArray(current) && current.length > 0) return current;
  const legacy = (section as ReportSection & { competitorProfiles?: unknown }).competitorProfiles;
  return Array.isArray(legacy) ? (legacy as KeyPlayerProfile[]) : [];
}
