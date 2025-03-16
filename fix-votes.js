const fs = require('fs');
const path = require('path');

// Path to votes file
const VOTES_FILE = path.join(process.cwd(), 'data', 'votes.json');

// Read the votes file
console.log('Reading votes file...');
const fileContent = fs.readFileSync(VOTES_FILE, 'utf8');
const voteData = JSON.parse(fileContent);

console.log('Current vote state:');
console.log('- Total votes:', Object.keys(voteData.votes).length);
console.log('- Products with vote counts:', Object.keys(voteData.voteCounts).length);

// Show the current vote counts before fixing
console.log('\nCurrent vote counts:');
Object.entries(voteData.voteCounts).forEach(([productId, counts]) => {
  console.log(`- ${productId}: ${counts.upvotes} upvotes, ${counts.downvotes} downvotes`);
});

// Calculate correct vote counts based on actual votes
console.log('\nRecalculating vote counts...');
const correctedCounts = {};

// Initialize all products with zero counts
Object.keys(voteData.voteCounts).forEach(productId => {
  correctedCounts[productId] = { upvotes: 0, downvotes: 0 };
});

// Count votes for each product
Object.entries(voteData.votes).forEach(([key, voteType]) => {
  const [productId] = key.split(':');
  
  if (voteType === 1) {
    correctedCounts[productId].upvotes++;
  } else if (voteType === -1) {
    correctedCounts[productId].downvotes++;
  }
});

// Show the corrected vote counts
console.log('\nCorrected vote counts:');
Object.entries(correctedCounts).forEach(([productId, counts]) => {
  const original = voteData.voteCounts[productId];
  const changed = (original.upvotes !== counts.upvotes || original.downvotes !== counts.downvotes);
  
  console.log(
    `- ${productId}: ${counts.upvotes} upvotes (was ${original.upvotes}), ` +
    `${counts.downvotes} downvotes (was ${original.downvotes})` +
    (changed ? ' - FIXED' : ' - OK')
  );
});

// Update the vote counts in the data
voteData.voteCounts = correctedCounts;
voteData.lastUpdated = new Date().toISOString();

// Check for dry run mode
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('\nDRY RUN - No changes were made to the file.');
} else {
  // Write the updated data back to the file
  console.log('\nWriting fixed data back to file...');
  fs.writeFileSync(VOTES_FILE, JSON.stringify(voteData, null, 2), 'utf8');
  console.log('Vote counts fixed successfully!');
}

// Print summary
console.log('\nSummary:');
console.log(`- Processed ${Object.keys(voteData.votes).length} individual votes`);
console.log(`- Updated ${Object.keys(voteData.voteCounts).length} product vote counts`);
console.log(`- Last updated: ${voteData.lastUpdated}`); 