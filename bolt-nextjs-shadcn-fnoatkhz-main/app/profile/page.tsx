"use client";

import { useState, useEffect } from "react";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ContributionMetrics } from "@/components/profile/contribution-metrics";
import { ActivityFeed } from "@/components/profile/activity-feed";
import { ProfileSidebar } from "@/components/profile/profile-sidebar";

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      // Fetch data from the /api/profile route
      const data = await fetch("/api/profile").then((res) => res.json());
      setProfileData(data);
    }

    fetchData();
  }, []);

  const activityLog = profileData?.activityLog || []; // Safe fallback

  return (
    <div className="container py-8">
      <ProfileHeader />
      
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr,300px]">
        <div className="space-y-8">
          <ContributionMetrics />
          <ActivityFeed profileData={{ activityLog }} />
        </div>
        <ProfileSidebar />
      </div>
    </div>
  );
}
