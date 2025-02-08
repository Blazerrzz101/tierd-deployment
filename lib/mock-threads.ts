import { Thread } from "@/types"

export const mockThreads: Thread[] = [
  {
    id: "1",
    title: "What's the best gaming mouse for small hands?",
    content: "I'm looking for recommendations for a gaming mouse suitable for small hands. Currently considering the Razer Viper Mini and G Pro X Superlight. Any thoughts?",
    category: "mice",
    author: {
      name: "Sarah Chen",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop"
    },
    upvotes: 24,
    commentCount: 12,
    createdAt: "2024-03-20T08:00:00Z"
  },
  {
    id: "2",
    title: "Mechanical vs Optical Switches: The Ultimate Showdown",
    content: "Let's discuss the pros and cons of mechanical vs optical switches for gaming keyboards. Share your experiences and preferences!",
    category: "keyboards",
    author: {
      name: "Alex Thompson",
      image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=32&h=32&fit=crop"
    },
    upvotes: 45,
    commentCount: 28,
    createdAt: "2024-03-19T15:30:00Z"
  },
  {
    id: "3",
    title: "Monitor Response Time: Marketing vs Reality",
    content: "Let's debunk some myths about monitor response times and discuss what numbers actually matter for competitive gaming.",
    category: "monitors",
    author: {
      name: "Tech_Enthusiast",
      image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=32&h=32&fit=crop"
    },
    upvotes: 67,
    commentCount: 34,
    createdAt: "2024-03-18T12:15:00Z"
  }
]