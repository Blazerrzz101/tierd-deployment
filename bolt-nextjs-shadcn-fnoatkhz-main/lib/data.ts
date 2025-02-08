import { Product, Category } from "@/types"

// Generate a large catalog of products
function generateProducts(): Product[] {
  const products: Product[] = [
    // Gaming Mice
    {
      id: "logitech-g502",
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
    {
      id: "razer-viper-v2",
      name: "Razer Viper V2 Pro",
      category: "gaming-mice",
      description: "Ultra-lightweight wireless gaming mouse with next-gen optical switches and Focus Pro 30K optical sensor.",
      imageUrl: "https://source.unsplash.com/random/400x400?razer-mouse",
      votes: 980,
      rank: 2,
      price: 149.99,
      specs: {
        sensor: "Focus Pro 30K",
        dpi: "100-30,000",
        buttons: "5 programmable",
        weight: "58g",
        battery: "Up to 80 hours",
        connection: "HyperSpeed Wireless"
      }
    },
    {
      id: "glorious-model-o",
      name: "Glorious Model O",
      category: "gaming-mice",
      description: "Ultra-lightweight gaming mouse with honeycomb shell design.",
      imageUrl: "https://source.unsplash.com/random/400x400?glorious-mouse",
      votes: 850,
      rank: 3,
      price: 79.99,
      specs: {
        sensor: "BAMF 19K",
        dpi: "400-19,000",
        buttons: "6 programmable",
        weight: "67g",
        battery: "N/A (Wired)",
        connection: "Ascended Cord"
      }
    },
    {
      id: "finalmouse-starlight",
      name: "Finalmouse Starlight-12",
      category: "gaming-mice",
      description: "Ultra-lightweight magnesium alloy wireless gaming mouse.",
      imageUrl: "https://source.unsplash.com/random/400x400?finalmouse",
      votes: 750,
      rank: 4,
      price: 189.99,
      specs: {
        sensor: "Finalsensor",
        dpi: "100-20,000",
        buttons: "6 programmable",
        weight: "42g",
        battery: "Up to 160 hours",
        connection: "Wireless"
      }
    },
    {
      id: "zowie-ec2",
      name: "ZOWIE EC2-C",
      category: "gaming-mice",
      description: "Professional gaming mouse designed for competitive FPS gaming.",
      imageUrl: "https://source.unsplash.com/random/400x400?zowie-mouse",
      votes: 680,
      rank: 5,
      price: 69.99,
      specs: {
        sensor: "3360",
        dpi: "400-3200",
        buttons: "5",
        weight: "73g",
        battery: "N/A (Wired)",
        connection: "Wired"
      }
    },
    // Keyboards
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
    {
      id: "keychron-q1",
      name: "Keychron Q1",
      category: "keyboards",
      description: "Customizable mechanical keyboard with aluminum case.",
      imageUrl: "https://source.unsplash.com/random/400x400?keychron",
      votes: 780,
      rank: 2,
      price: 169.99,
      specs: {
        switches: "Gateron",
        layout: "75%",
        keycaps: "Double-shot PBT",
        lighting: "RGB",
        connection: "USB-C",
        features: "QMK/VIA"
      }
    },
    {
      id: "gmmk-pro",
      name: "GMMK Pro",
      category: "keyboards",
      description: "Premium 75% mechanical keyboard with rotary knob.",
      imageUrl: "https://source.unsplash.com/random/400x400?gmmk",
      votes: 720,
      rank: 3,
      price: 349.99,
      specs: {
        switches: "Hot-swappable",
        layout: "75%",
        keycaps: "ABS",
        lighting: "RGB",
        connection: "USB-C",
        features: "Aluminum case"
      }
    },
    // Monitors
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
    {
      id: "lg-27gp950",
      name: "LG 27GP950-B",
      category: "monitors",
      description: "27-inch 4K 144Hz Gaming Monitor with HDMI 2.1.",
      imageUrl: "https://source.unsplash.com/random/400x400?lg-monitor",
      votes: 580,
      rank: 2,
      price: 899.99,
      specs: {
        panel: "Nano IPS",
        resolution: "3840x2160",
        refresh: "144Hz",
        response: "1ms GTG",
        hdr: "HDR600",
        size: "27 inch"
      }
    },
    {
      id: "samsung-g7",
      name: "Samsung Odyssey G7",
      category: "monitors",
      description: "32-inch curved gaming monitor with 240Hz refresh rate.",
      imageUrl: "https://source.unsplash.com/random/400x400?samsung-monitor",
      votes: 520,
      rank: 3,
      price: 799.99,
      specs: {
        panel: "VA",
        resolution: "2560x1440",
        refresh: "240Hz",
        response: "1ms GTG",
        hdr: "HDR600",
        size: "32 inch"
      }
    },
    // Headsets
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
    {
      id: "steelseries-arctis-7",
      name: "SteelSeries Arctis 7+",
      category: "headsets",
      description: "Wireless gaming headset with low-latency connection.",
      imageUrl: "https://source.unsplash.com/random/400x400?steelseries",
      votes: 840,
      rank: 2,
      price: 169.99,
      specs: {
        drivers: "40mm Neodymium",
        frequency: "20Hz-20kHz",
        battery: "30 hours",
        weight: "354g",
        connection: "2.4GHz Wireless",
        microphone: "Retractable"
      }
    },
    {
      id: "sennheiser-pc38x",
      name: "Sennheiser PC38X",
      category: "headsets",
      description: "Audiophile-grade gaming headset with open-back design.",
      imageUrl: "https://source.unsplash.com/random/400x400?sennheiser",
      votes: 760,
      rank: 3,
      price: 169.99,
      specs: {
        drivers: "50mm",
        frequency: "10Hz-30kHz",
        impedance: "28 ohm",
        weight: "253g",
        connection: "3.5mm",
        microphone: "Noise-cancelling"
      }
    }
  ]

  // Sort products by votes within each category
  return products.sort((a, b) => b.votes - a.votes)
}

export const products = generateProducts()

export const categories: Category[] = [
  {
    id: "gaming-mice",
    name: "Gaming Mice",
    slug: "gaming-mice",
    description: "High-performance gaming mice for precise control"
  },
  {
    id: "keyboards",
    name: "Keyboards",
    slug: "keyboards",
    description: "Mechanical and gaming keyboards for every style"
  },
  {
    id: "monitors",
    name: "Monitors",
    slug: "monitors",
    description: "Gaming monitors for immersive experience"
  },
  {
    id: "headsets",
    name: "Headsets",
    slug: "headsets",
    description: "Gaming headsets for crystal-clear audio"
  }
]