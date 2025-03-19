'use client';

import { useState, useEffect, useCallback } from 'react';
import { VoteCounts } from '../lib/vote-utils';

// Types for server events
interface VoteUpdateEvent {
  productId: string;
  voteCounts: VoteCounts;
  timestamp: string;
}

interface InitialStateEvent {
  votes: Record<string, number>;
  voteCounts: Record<string, VoteCounts>;
  lastUpdated: string;
}

interface VoteState {
  votes: Record<string, number>;
  voteCounts: Record<string, { upvotes: number, downvotes: number }>;
  lastUpdated: string;
  userVotes: Array<{
    productId: string;
    clientId: string;
    voteType: number;
    timestamp: string;
  }>;
}

interface VoteUpdatesHook {
  voteState: VoteState | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  lastUpdate: Date | null;
  updateCount: number;
  connect: () => void;
  disconnect: () => void;
}

const defaultVoteState: VoteState = {
  votes: {},
  voteCounts: {},
  lastUpdated: new Date().toISOString(),
  userVotes: []
};

/**
 * Hook to subscribe to real-time vote updates
 */
export function useVoteUpdates(): VoteUpdatesHook {
  const [voteState, setVoteState] = useState<VoteState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  
  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Close existing connection
    if (eventSource) {
      eventSource.close();
    }
    
    // Fetch initial state
    fetchInitialState();
    
    // Connect to SSE endpoint
    setConnectionStatus('connecting');
    const newEventSource = new EventSource('/api/vote/updates');
    setEventSource(newEventSource);
    
    // Set up event handlers
    newEventSource.onopen = () => {
      setConnectionStatus('connected');
    };
    
    newEventSource.onerror = () => {
      setConnectionStatus('disconnected');
      // Try to reconnect after 5 seconds
      setTimeout(() => {
        newEventSource.close();
        connect();
      }, 5000);
    };
    
    newEventSource.addEventListener('vote-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        setVoteState(data.voteState);
        setLastUpdate(new Date());
        setUpdateCount(prev => prev + 1);
      } catch (error) {
        console.error('Error parsing vote update:', error);
      }
    });
    
    return () => {
      newEventSource.close();
    };
  }, [eventSource]);
  
  const disconnect = useCallback(() => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      setConnectionStatus('disconnected');
    }
  }, [eventSource]);
  
  const fetchInitialState = async () => {
    try {
      const response = await fetch('/api/vote/state');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setVoteState(data.voteState);
        }
      }
    } catch (error) {
      console.error('Error fetching initial vote state:', error);
    }
  };
  
  // Connect when the component mounts
  useEffect(() => {
    connect();
    
    // Clean up when the component unmounts
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  return {
    voteState: voteState || defaultVoteState,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    lastUpdate,
    updateCount,
    connect,
    disconnect
  };
} 