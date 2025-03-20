/**
 * Reputation System for Tier'd Community
 * 
 * This utility helps reward active and valuable community members
 * with recognition based on their contributions and activity.
 */

// Reputation levels with their requirements and badges
export const REPUTATION_LEVELS = [
  {
    level: 0,
    name: "Newcomer",
    minPoints: 0,
    badge: "🔰",
    color: "text-gray-500",
    borderColor: "border-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  {
    level: 1,
    name: "Explorer",
    minPoints: 50,
    badge: "🔍",
    color: "text-blue-500",
    borderColor: "border-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-900/30",
  },
  {
    level: 2,
    name: "Contributor",
    minPoints: 150,
    badge: "⭐",
    color: "text-emerald-500",
    borderColor: "border-emerald-300",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/30",
  },
  {
    level: 3,
    name: "Expert",
    minPoints: 500,
    badge: "🏆",
    color: "text-purple-500",
    borderColor: "border-purple-300",
    bgColor: "bg-purple-50 dark:bg-purple-900/30",
  },
  {
    level: 4,
    name: "Veteran",
    minPoints: 1000,
    badge: "🌟",
    color: "text-amber-500",
    borderColor: "border-amber-300",
    bgColor: "bg-amber-50 dark:bg-amber-900/30",
  },
  {
    level: 5,
    name: "Master",
    minPoints: 2500,
    badge: "👑",
    color: "text-red-500",
    borderColor: "border-red-300",
    bgColor: "bg-red-50 dark:bg-red-900/30",
  },
];

// Point values for different activities
export const ACTIVITY_POINTS = {
  THREAD_CREATED: 10,
  COMMENT_POSTED: 5,
  UPVOTE_RECEIVED: 2,
  PRODUCT_REVIEW_POSTED: 15,
  HELPFUL_VOTE_RECEIVED: 3,
  VERIFIED_PURCHASE: 20,
  DAILY_LOGIN: 1,
};

/**
 * Calculate user reputation level based on points
 */
export function getUserReputationLevel(points: number) {
  // Find the highest level the user qualifies for
  for (let i = REPUTATION_LEVELS.length - 1; i >= 0; i--) {
    if (points >= REPUTATION_LEVELS[i].minPoints) {
      return REPUTATION_LEVELS[i];
    }
  }
  
  // Default to newcomer
  return REPUTATION_LEVELS[0];
}

/**
 * Calculate progress to next level
 */
export function getProgressToNextLevel(points: number) {
  const currentLevel = getUserReputationLevel(points);
  const currentLevelIndex = REPUTATION_LEVELS.findIndex(level => level.level === currentLevel.level);
  
  // If at max level, return 100%
  if (currentLevelIndex === REPUTATION_LEVELS.length - 1) {
    return 100;
  }
  
  const nextLevel = REPUTATION_LEVELS[currentLevelIndex + 1];
  const pointsForCurrentLevel = currentLevel.minPoints;
  const pointsForNextLevel = nextLevel.minPoints;
  
  // Calculate progress percentage
  const progress = ((points - pointsForCurrentLevel) / (pointsForNextLevel - pointsForCurrentLevel)) * 100;
  
  // Ensure value is between 0 and 100
  return Math.min(Math.max(progress, 0), 100);
}

/**
 * Format reputation display name with emoji
 */
export function formatReputationDisplay(reputation: typeof REPUTATION_LEVELS[0]) {
  return `${reputation.badge} ${reputation.name}`;
}

/**
 * Check if a user should be considered trusted based on reputation
 */
export function isTrustedUser(points: number) {
  const level = getUserReputationLevel(points);
  return level.level >= 2; // Contributor or higher
}

/**
 * Calculate points needed for next level
 */
export function getPointsNeededForNextLevel(points: number) {
  const currentLevel = getUserReputationLevel(points);
  const currentLevelIndex = REPUTATION_LEVELS.findIndex(level => level.level === currentLevel.level);
  
  // If at max level, return 0
  if (currentLevelIndex === REPUTATION_LEVELS.length - 1) {
    return 0;
  }
  
  const nextLevel = REPUTATION_LEVELS[currentLevelIndex + 1];
  return nextLevel.minPoints - points;
} 