"use client";

export function ActivityFeed({ profileData }: { profileData: any }) {
  const activityLog = profileData?.activityLog || []; // Provide a safe fallback

  return (
    <div>
      {activityLog.length > 0 ? (
        activityLog.map((log: any, index: number) => (
          <div key={index}>
            {/* Render each log */}
            <p>{log.message || "No message available"}</p>
          </div>
        ))
      ) : (
        <p>No activity found.</p>
      )}
    </div>
  );
}
