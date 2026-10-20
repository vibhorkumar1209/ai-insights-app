import { redirect } from 'next/navigation';

// Business Segment is a tab of the Business Segments page; this keeps the
// earlier standalone URL working.
export default function BusinessSegmentRedirect() {
  redirect('/business-segments?tab=dossier');
}
