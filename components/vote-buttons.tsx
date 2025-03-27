/**
 * Re-export the unified VoteButtons component
 * 
 * This file exists to provide backward compatibility with existing code
 * that imports VoteButtons from this path. It now uses the GlobalVoteButtons
 * component which ensures consistent vote tracking across the site.
 */
export { GlobalVoteButtons as VoteButtons } from '@/components/products/global-vote-buttons'; 