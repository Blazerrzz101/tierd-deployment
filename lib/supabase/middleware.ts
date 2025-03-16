/**
 * Vote validation middleware
 */
export const validateVote = (vote: number) => {
  if (![-1, 0, 1].includes(vote)) {
    throw new Error('Invalid vote type. Must be -1, 0, or 1');
  }
};

/**
 * Calculate hot score using Reddit's algorithm
 * score = log10(max(|upvotes - downvotes|, 1)) + sign(upvotes - downvotes) * seconds / 45000
 */
export const calculateHotScore = (upvotes: number, downvotes: number, date: Date) => {
  const score = upvotes - downvotes;
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  const seconds = date.getTime() / 1000 - 1134028003; // Reddit's epoch
  return Number((sign * order + seconds / 45000).toFixed(7));
};

/**
 * Validate product ranking data
 */
export const validateRankingData = (data: any) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid ranking data');
  }

  const requiredFields = ['id', 'upvotes', 'downvotes', 'net_score', 'rank'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (data.upvotes < 0 || data.downvotes < 0) {
    throw new Error('Vote counts cannot be negative');
  }

  if (data.net_score !== data.upvotes - data.downvotes) {
    throw new Error('Net score calculation mismatch');
  }
}; 