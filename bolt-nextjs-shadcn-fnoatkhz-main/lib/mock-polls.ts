import { Poll } from "@/types"

export const mockPolls: Poll[] = [
  {
    id: "1",
    question: "What's your preferred mouse grip style?",
    options: [
      { id: "1", text: "Palm Grip", votes: 245 },
      { id: "2", text: "Claw Grip", votes: 189 },
      { id: "3", text: "Fingertip Grip", votes: 167 }
    ],
    totalVotes: 601,
    daysLeft: 3,
    userVote: null
  },
  {
    id: "2",
    question: "Which switch type do you prefer for gaming?",
    options: [
      { id: "1", text: "Linear (Red)", votes: 312 },
      { id: "2", text: "Tactile (Brown)", votes: 234 },
      { id: "3", text: "Clicky (Blue)", votes: 156 },
      { id: "4", text: "Optical", votes: 198 }
    ],
    totalVotes: 900,
    daysLeft: 5,
    userVote: null
  },
  {
    id: "3",
    question: "What's the most important factor when choosing a gaming monitor?",
    options: [
      { id: "1", text: "Refresh Rate", votes: 423 },
      { id: "2", text: "Response Time", votes: 289 },
      { id: "3", text: "Resolution", votes: 345 },
      { id: "4", text: "Panel Type", votes: 167 }
    ],
    totalVotes: 1224,
    daysLeft: 2,
    userVote: null
  }
]