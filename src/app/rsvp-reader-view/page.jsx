import { Suspense } from "react";
import RSVPReaderView from "../../features/rsvp-reader-view";

export const metadata = {
  title: "RSVP Reader - SpeedReader",
  description:
    "Focused RSVP reading experience with adaptive controls and personalized themes.",
};

export default function RSVPReaderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <RSVPReaderView />
    </Suspense>
  );
}
