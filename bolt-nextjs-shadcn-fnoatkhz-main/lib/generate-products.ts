"use client"

import { Product } from "@/types"

export function generateMockProducts(): Product[] {
  const mice = [
    {
      id: "logitech-g502-x",
      name: "Logitech G502 X PLUS",
      category: "gaming-mice",
      description: "LIGHTFORCE hybrid optical-mechanical switches and LIGHTSPEED wireless technology combine in our most advanced gaming mouse ever.",
      imageUrl: "https://source.unsplash.com/random/400x400?gaming-mouse",
      votes: 1250,
      rank: 1,
      price: 149.99,
      specs: {
        sensor: "HERO 25K",
        dpi: "100-25,600",
        buttons: "13 programmable",
        weight: "89g",
        battery: "Up to 60 hours",
        connection: "LIGHTSPEED Wireless"
      }
    },
    // Add 20 more mice here
  ]

  const keyboards = [
    {
      id: "ducky-one-3",
      name: "Ducky One 3",
      category: "keyboards",
      description: "Premium mechanical keyboard with hot-swappable switches.",
      imageUrl: "https://source.unsplash.com/random/400x400?mechanical-keyboard",
      votes: 890,
      rank: 1,
      price: 129.99,
      specs: {
        switches: "Cherry MX",
        layout: "Full-size",
        keycaps: "PBT Double-shot",
        lighting: "RGB",
        connection: "USB-C",
        features: "Hot-swappable"
      }
    },
    // Add 20 more keyboards here
  ]

  const monitors = [
    {
      id: "asus-pg279qm",
      name: "ASUS ROG Swift PG279QM",
      category: "monitors",
      description: "27-inch 1440p 240Hz Gaming Monitor with G-SYNC.",
      imageUrl: "https://source.unsplash.com/random/400x400?gaming-monitor",
      votes: 670,
      rank: 1,
      price: 799.99,
      specs: {
        panel: "IPS",
        resolution: "2560x1440",
        refresh: "240Hz",
        response: "1ms GTG",
        hdr: "HDR400",
        size: "27 inch"
      }
    },
    // Add 20 more monitors here
  ]

  const headsets = [
    {
      id: "hyperx-cloud-alpha",
      name: "HyperX Cloud Alpha",
      category: "headsets",
      description: "Premium gaming headset with dual chamber drivers.",
      imageUrl: "https://source.unsplash.com/random/400x400?gaming-headset",
      votes: 920,
      rank: 1,
      price: 99.99,
      specs: {
        drivers: "50mm Dual Chamber",
        frequency: "13Hz-27kHz",
        impedance: "65 ohm",
        weight: "336g",
        connection: "3.5mm",
        microphone: "Detachable"
      }
    },
    // Add 20 more headsets here
  ]

  return [...mice, ...keyboards, ...monitors, ...headsets]
}