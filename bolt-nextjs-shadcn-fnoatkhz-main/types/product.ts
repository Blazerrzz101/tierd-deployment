"use client"

export interface Product {
  id: string
  name: string
  category: string
  description: string
  imageUrl: string
  votes: number
  rank: number
  price: number
  userVote?: 'up' | 'down' | null
  specs: {
    sensor: string
    dpi: string
    buttons: string
    weight: string
    battery: string
    connection: string
    [key: string]: string
  }
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
}

export type VoteType = 'up' | 'down' | null