"use client";

import { LandingPage } from "@/components/home/landing-page";
import LiveUpdates from "@/components/LiveUpdates";

export default function HomePage() {
  return (
    <div>
      <LandingPage />
      <h1>Gaming Gear Ranked by Gamers</h1>
      <LiveUpdates />
    </div>
  );
}
