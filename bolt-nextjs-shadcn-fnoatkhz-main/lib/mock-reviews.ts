import { Review } from "@/types"

export const mockReviews: Review[] = [
  {
    id: "1",
    productId: "1",
    userId: "user1",
    rating: 5,
    title: "Best Gaming Mouse Ever!",
    content: "The Razer DeathAdder V3 Pro is incredibly lightweight and responsive. The battery life is amazing, and the sensor is flawless. Definitely worth the investment for serious gamers.",
    helpfulCount: 42,
    createdAt: "2024-03-20T10:00:00Z",
    user: {
      name: "John Doe",
      image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=32&h=32&fit=crop"
    }
  },
  {
    id: "2",
    productId: "2",
    userId: "user2",
    rating: 4,
    title: "Great Mouse, Slightly Pricey",
    content: "The G Pro X Superlight lives up to its name. The weight reduction is noticeable, and it glides smoothly. Only complaint is the price point, but the quality justifies it.",
    helpfulCount: 28,
    createdAt: "2024-03-19T15:30:00Z",
    user: {
      name: "Jane Smith",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop"
    }
  },
  {
    id: "3",
    productId: "3",
    userId: "user3",
    rating: 5,
    title: "Game-Changing Keyboard",
    content: "The adjustable actuation on the Apex Pro is revolutionary. Being able to customize the sensitivity for different games is incredible. Build quality is top-notch.",
    helpfulCount: 35,
    createdAt: "2024-03-18T09:15:00Z",
    user: {
      name: "Mike Johnson",
      image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=32&h=32&fit=crop"
    }
  }
]