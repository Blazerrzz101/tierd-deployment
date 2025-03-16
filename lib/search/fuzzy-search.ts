// Fuzzy search implementation using Levenshtein distance
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1, // substitution
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1      // insertion
        )
      }
    }
  }

  return dp[m][n]
}

interface FuzzySearchOptions {
  keys: string[]
  weights?: Record<string, number>
  threshold?: number
}

interface MatchPart {
  text: string
  isMatch: boolean
}

// Calculate similarity score between 0 and 1
function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  const maxLength = Math.max(str1.length, str2.length)
  return 1 - distance / maxLength
}

// Fuzzy search implementation
export function fuzzySearch<T extends Record<string, any>>(
  items: T[],
  query: string,
  options: FuzzySearchOptions
): T[] {
  const { keys, weights = {}, threshold = 0.4 } = options

  // Normalize weights
  const normalizedWeights = keys.reduce((acc, key) => {
    acc[key] = weights[key] || 1
    return acc
  }, {} as Record<string, number>)

  // Calculate total weight
  const totalWeight = Object.values(normalizedWeights).reduce((a, b) => a + b, 0)

  // Score each item
  const scoredItems = items.map(item => {
    let totalScore = 0

    // Calculate weighted score for each key
    keys.forEach(key => {
      const value = String(item[key] || '').toLowerCase()
      const queryTerms = query.toLowerCase().split(' ')
      
      // Get best match score among all query terms
      const bestScore = queryTerms.reduce((maxScore, term) => {
        const similarity = calculateSimilarity(value, term)
        return Math.max(maxScore, similarity)
      }, 0)

      totalScore += (bestScore * normalizedWeights[key]) / totalWeight
    })

    return { item, score: totalScore }
  })

  // Filter and sort by score
  return scoredItems
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
}

// Highlight matching parts of text
export function highlightMatches(text: string, query: string): MatchPart[] {
  if (!query.trim()) return [{ text, isMatch: false }]

  const parts: MatchPart[] = []
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  let lastIndex = 0

  // Find all matches
  const matches: { start: number; end: number }[] = []
  let searchIndex = 0

  while (searchIndex < lowerText.length) {
    const matchIndex = lowerText.indexOf(lowerQuery, searchIndex)
    if (matchIndex === -1) break

    matches.push({
      start: matchIndex,
      end: matchIndex + lowerQuery.length
    })
    searchIndex = matchIndex + 1
  }

  // Build parts array
  matches.forEach((match, index) => {
    // Add non-matching part before this match
    if (match.start > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, match.start),
        isMatch: false
      })
    }

    // Add matching part
    parts.push({
      text: text.substring(match.start, match.end),
      isMatch: true
    })

    lastIndex = match.end

    // Add remaining text after last match
    if (index === matches.length - 1 && lastIndex < text.length) {
      parts.push({
        text: text.substring(lastIndex),
        isMatch: false
      })
    }
  })

  // If no matches were found, return the entire text as non-matching
  if (parts.length === 0) {
    parts.push({ text, isMatch: false })
  }

  return parts
} 