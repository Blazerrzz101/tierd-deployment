import { NextRequest, NextResponse } from "next/server";
import { getVoteState } from '../../lib/vote-utils';
import { getClientId } from '@/utils/client-id';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface MockProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  url_slug: string;
  image_url: string;
  specifications: Record<string, string>;
  created_at: string;
  updated_at: string;
  rating: number;
  review_count: number;
  reviews: any[];
  threads: any[];
  upvotes?: number;
  downvotes?: number;
  userVote?: number | null;
  score?: number;
  rank?: number;
  alternativeSlugs?: string[];
}

// Helper function to ensure valid slugs
function generateSafeSlug(name: string, id: string): string {
  if (!name) return `product-${id}`;
  
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

// Mock product data for testing
export const mockProducts: MockProduct[] = [
  {
    id: "j1k2l3m4-n5o6-p7q8-r9s0-t1u2v3w4x5y6",
    name: "LG 27GP950-B",
    description: "27-inch UltraGear™ UHD Nano IPS 1ms 144Hz HDR600 Monitor with G-SYNC® Compatible",
    category: "monitors",
    price: 899.99,
    url_slug: "lg-27gp950",
    image_url: "/images/products/lg-27gp950.jpg",
    specifications: {
      "Panel Type": "Nano IPS",
      "Resolution": "3840 x 2160 (UHD 4K)",
      "Refresh Rate": "144Hz",
      "Response Time": "1ms GtG",
      "HDR": "VESA DisplayHDR 600",
      "Connectivity": "2x HDMI 2.1, 1x DisplayPort 1.4, 1x USB-C",
      "Model Variants": "27GP950-B (Black)"
    },
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-04-15T00:00:00Z",
    rating: 4.8,
    review_count: 147,
    reviews: [],
    threads: [],
    // Add alternate slugs for better URL compatibility
    alternativeSlugs: ["lg-27gp950-b"]
  },
  {
    id: "c8d9e0f1-2a3b-4c5d-6e7f-8g9h0i1j2k3l",
    name: "Samsung Odyssey G7",
    description: "32-inch QLED 1000R Curved Gaming Monitor with 240Hz refresh rate and 1ms response time",
    category: "monitors",
    price: 749.99,
    url_slug: "samsung-odyssey-g7",
    image_url: "/images/products/samsung-g7.jpg",
    specifications: {
      "Panel Type": "QLED VA",
      "Resolution": "2560 x 1440 (QHD)",
      "Refresh Rate": "240Hz",
      "Response Time": "1ms MPRT",
      "HDR": "VESA DisplayHDR 600",
      "Connectivity": "2x HDMI 2.0, 1x DisplayPort 1.4"
    },
    created_at: "2023-02-10T00:00:00Z",
    updated_at: "2023-05-20T00:00:00Z",
    rating: 4.6,
    review_count: 129,
    reviews: [],
    threads: []
  },
  {
    id: "9dd2bfe2-6eef-40de-ae12-c35ff1975914",
    name: "Logitech G Pro X Superlight",
    description: "Ultra-lightweight wireless gaming mouse for esports professionals",
    category: "mice",
    price: 149.99,
    url_slug: "logitech-g-pro-x-superlight",
    image_url: "/images/products/g-pro-superlight.jpg",
    specifications: {
      "Sensor": "HERO 25K",
      "DPI Range": "100-25,600",
      "Weight": "63g",
      "Battery Life": "Up to 70 hours",
      "Connectivity": "Wireless (LIGHTSPEED)",
      "Buttons": "5 Programmable Buttons"
    },
    created_at: "2023-03-15T00:00:00Z",
    updated_at: "2023-06-18T00:00:00Z",
    rating: 4.9,
    review_count: 218,
    reviews: [],
    threads: []
  },
  {
    id: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    name: "Razer Huntsman V2",
    description: "Optical gaming keyboard with 8000Hz polling rate and sound dampening foam",
    category: "keyboards",
    price: 199.99,
    url_slug: "razer-huntsman-v2",
    image_url: "/images/products/huntsman-v2.jpg",
    specifications: {
      "Switch Type": "Razer Gen-2 Optical Switch",
      "Keycaps": "Doubleshot PBT",
      "Polling Rate": "8000Hz",
      "Lighting": "Razer Chroma RGB",
      "Wrist Rest": "Detachable Leatherette",
      "Media Controls": "Digital Dial and Keys"
    },
    created_at: "2023-02-20T00:00:00Z",
    updated_at: "2023-07-01T00:00:00Z",
    rating: 4.7,
    review_count: 156,
    reviews: [],
    threads: []
  },
  {
    id: "q1w2e3r4-t5y6-u7i8-o9p0-a1s2d3f4g5h6",
    name: "SteelSeries Arctis Pro Wireless",
    description: "Premium high-fidelity gaming audio system with dual-wireless technology",
    category: "headsets",
    price: 329.99,
    url_slug: "steelseries-arctis-pro-wireless",
    image_url: "/images/products/arctis-pro-wireless.jpg",
    specifications: {
      "Driver": "40mm Neodymium",
      "Frequency Response": "10-40,000 Hz",
      "Microphone": "ClearCast Bidirectional",
      "Battery Life": "20+ hours (with 2 swappable batteries)",
      "Connectivity": "2.4GHz Wireless & Bluetooth",
      "Surround Sound": "DTS Headphone:X v2.0"
    },
    created_at: "2023-01-25T00:00:00Z",
    updated_at: "2023-06-12T00:00:00Z",
    rating: 4.5,
    review_count: 173,
    reviews: [],
    threads: []
  },
  {
    id: "z1x2c3v4-b5n6-m7k8-j9h0-g1f2d3s4a5",
    name: "ASUS ROG Swift PG32UQX",
    description: "32-inch 4K HDR mini-LED gaming monitor with 144Hz refresh rate",
    category: "monitors",
    price: 2999.99,
    url_slug: "asus-rog-swift-pg32uqx",
    image_url: "/images/products/pg32uqx.jpg",
    specifications: {
      "Panel Type": "IPS with Mini-LED Backlight",
      "Resolution": "3840 x 2160 (UHD 4K)",
      "Refresh Rate": "144Hz",
      "Response Time": "4ms (GtG)",
      "HDR": "VESA DisplayHDR 1400",
      "Connectivity": "1x DisplayPort 1.4, 3x HDMI 2.0, USB Hub"
    },
    created_at: "2023-04-05T00:00:00Z",
    updated_at: "2023-08-10T00:00:00Z",
    rating: 4.7,
    review_count: 94,
    reviews: [],
    threads: []
  },
  {
    id: "p9o8i7u6-y5t4-r3e2-w1q0-z9x8c7v6b5",
    name: "Glorious Model O",
    description: "Ultra-lightweight gaming mouse with honeycomb shell design",
    category: "mice",
    price: 79.99,
    url_slug: "glorious-model-o",
    image_url: "/images/products/model-o.jpg",
    specifications: {
      "Sensor": "Pixart PMW 3360",
      "DPI Range": "400-12,000",
      "Weight": "67g",
      "Cable": "Ascended Cord (Ultra-flexible)",
      "Connectivity": "Wired",
      "Buttons": "6 Programmable Buttons"
    },
    created_at: "2023-03-20T00:00:00Z",
    updated_at: "2023-07-15T00:00:00Z",
    rating: 4.6,
    review_count: 182,
    reviews: [],
    threads: []
  },
  {
    id: "n4m3b2v1-c8x7z6-p5o4i3-u2y1t0-r9e8w7q6",
    name: "Corsair K70 RGB MK.2",
    description: "Mechanical gaming keyboard with Cherry MX switches and per-key RGB lighting",
    category: "keyboards",
    price: 159.99,
    url_slug: "corsair-k70-rgb-mk2",
    image_url: "/images/products/k70-rgb-mk2.jpg",
    specifications: {
      "Switch Type": "Cherry MX (Red, Blue, Brown, Speed, Silent)",
      "Keycaps": "ABS",
      "Polling Rate": "1000Hz",
      "Lighting": "Per-Key RGB",
      "Wrist Rest": "Detachable Soft-Touch",
      "Media Controls": "Dedicated Buttons and Volume Roller"
    },
    created_at: "2023-02-15T00:00:00Z",
    updated_at: "2023-06-28T00:00:00Z",
    rating: 4.5,
    review_count: 210,
    reviews: [],
    threads: []
  },
  {
    id: "l5k4j3h2-g1f0d9-s8a7p6-o5i4u3-y2t1r0e9",
    name: "HyperX Cloud Alpha",
    description: "Gaming headset with dual chamber drivers for less distortion and more clarity",
    category: "headsets",
    price: 99.99,
    url_slug: "hyperx-cloud-alpha",
    image_url: "/images/products/cloud-alpha.jpg",
    specifications: {
      "Driver": "50mm with dual chamber",
      "Frequency Response": "13-27,000 Hz",
      "Microphone": "Detachable Noise-cancelling",
      "Connection": "3.5mm",
      "Compatibility": "PC, PS4, Xbox One, Nintendo Switch, Mobile",
      "Features": "Aluminum Frame, Memory Foam Ear Cushions"
    },
    created_at: "2023-01-18T00:00:00Z",
    updated_at: "2023-05-30T00:00:00Z",
    rating: 4.6,
    review_count: 228,
    reviews: [],
    threads: []
  },
  {
    id: "w9q8e7r6-t5y4u3-i2o1p0-a9s8d7-f6g5h4j3",
    name: "Gigabyte M32UC",
    description: "32-inch 4K curved gaming monitor with 144Hz refresh rate and 1ms response time",
    category: "monitors",
    price: 699.99,
    url_slug: "gigabyte-m32uc",
    image_url: "/images/products/m32uc.jpg",
    specifications: {
      "Panel Type": "VA",
      "Resolution": "3840 x 2160 (UHD 4K)",
      "Refresh Rate": "144Hz",
      "Response Time": "1ms MPRT",
      "HDR": "VESA DisplayHDR 400",
      "Connectivity": "2x HDMI 2.1, 1x DisplayPort 1.4, USB Hub"
    },
    created_at: "2023-04-10T00:00:00Z",
    updated_at: "2023-07-25T00:00:00Z",
    rating: 4.4,
    review_count: 112,
    reviews: [],
    threads: []
  },

  // EXPANDED PRODUCT CATALOG - MONITORS
  {
    id: "dell-aw3423dw",
    name: "Dell Alienware AW3423DW",
    description: "34-inch QD-OLED curved gaming monitor with 175Hz refresh rate and G-SYNC Ultimate",
    category: "monitors",
    price: 1299.99,
    url_slug: "dell-alienware-aw3423dw",
    image_url: "/images/products/alienware-aw3423dw.jpg",
    specifications: {
      "Panel Type": "QD-OLED",
      "Resolution": "3440 x 1440 (UWQHD)",
      "Refresh Rate": "175Hz",
      "Response Time": "0.1ms GtG",
      "HDR": "DisplayHDR True Black 400",
      "Connectivity": "2x DisplayPort 1.4, 1x HDMI 2.0"
    },
    created_at: "2023-05-15T00:00:00Z",
    updated_at: "2023-09-05T00:00:00Z",
    rating: 4.9,
    review_count: 176,
    reviews: [],
    threads: [],
    upvotes: 380,
    downvotes: 25,
    score: 355,
    rank: 1
  },
  {
    id: "msi-optix-mag274qrf-qd",
    name: "MSI Optix MAG274QRF-QD",
    description: "27-inch Rapid IPS gaming monitor with Quantum Dot technology and 165Hz refresh rate",
    category: "monitors",
    price: 549.99,
    url_slug: "msi-optix-mag274qrf-qd",
    image_url: "/images/products/msi-mag274qrf.jpg",
    specifications: {
      "Panel Type": "Rapid IPS",
      "Resolution": "2560 x 1440 (QHD)",
      "Refresh Rate": "165Hz",
      "Response Time": "1ms GtG",
      "HDR": "HDR Ready",
      "Connectivity": "1x DisplayPort 1.4, 2x HDMI 2.0b, 1x USB-C"
    },
    created_at: "2023-06-10T00:00:00Z",
    updated_at: "2023-10-22T00:00:00Z",
    rating: 4.7,
    review_count: 142,
    reviews: [],
    threads: [],
    upvotes: 340,
    downvotes: 30,
    score: 310,
    rank: 2
  },
  {
    id: "lg-34gp83a-b",
    name: "LG 34GP83A-B",
    description: "34-inch UltraGear curved gaming monitor with 160Hz refresh rate and 1ms response time",
    category: "monitors",
    price: 799.99,
    url_slug: "lg-34gp83a-b",
    image_url: "/images/products/lg-34gp83a.jpg",
    specifications: {
      "Panel Type": "Nano IPS",
      "Resolution": "3440 x 1440 (UWQHD)",
      "Refresh Rate": "160Hz",
      "Response Time": "1ms GtG",
      "HDR": "VESA DisplayHDR 400",
      "Connectivity": "2x HDMI, 1x DisplayPort, USB Hub"
    },
    created_at: "2023-02-15T00:00:00Z",
    updated_at: "2023-07-20T00:00:00Z",
    rating: 4.8,
    review_count: 187,
    reviews: [],
    threads: [],
    upvotes: 315,
    downvotes: 22,
    score: 293,
    rank: 3
  },
  {
    id: "asus-rog-swift-pg259qn",
    name: "ASUS ROG Swift PG259QN",
    description: "24.5-inch gaming monitor with 360Hz refresh rate and 1ms response time",
    category: "monitors",
    price: 699.99,
    url_slug: "asus-rog-swift-pg259qn",
    image_url: "/images/products/asus-pg259qn.jpg",
    specifications: {
      "Panel Type": "Fast IPS",
      "Resolution": "1920 x 1080 (FHD)",
      "Refresh Rate": "360Hz",
      "Response Time": "1ms GtG",
      "HDR": "HDR10",
      "Connectivity": "1x DisplayPort 1.4, 2x HDMI 2.0, USB Hub"
    },
    created_at: "2023-04-10T00:00:00Z",
    updated_at: "2023-09-15T00:00:00Z",
    rating: 4.6,
    review_count: 120,
    reviews: [],
    threads: [],
    upvotes: 280,
    downvotes: 25,
    score: 255,
    rank: 4
  },
  {
    id: "benq-zowie-xl2546k",
    name: "BenQ ZOWIE XL2546K",
    description: "24.5-inch esports gaming monitor with DyAc+ technology and 240Hz refresh rate",
    category: "monitors",
    price: 549.99,
    url_slug: "benq-zowie-xl2546k",
    image_url: "/images/products/benq-zowie-xl2546k.jpg",
    specifications: {
      "Panel Type": "TN",
      "Resolution": "1920 x 1080 (FHD)",
      "Refresh Rate": "240Hz",
      "Response Time": "0.5ms (MPRT)",
      "Special Features": "DyAc+, S-Switch, Shield",
      "Connectivity": "3x HDMI 2.0, 1x DisplayPort 1.4, USB Hub"
    },
    created_at: "2023-01-18T00:00:00Z",
    updated_at: "2023-06-15T00:00:00Z",
    rating: 4.8,
    review_count: 167,
    reviews: [],
    threads: [],
    upvotes: 270,
    downvotes: 18,
    score: 252,
    rank: 5
  },
  
  // EXPANDED PRODUCT CATALOG - MICE
  {
    id: "razer-deathadder-v3-pro",
    name: "Razer DeathAdder V3 Pro",
    description: "Lightweight wireless gaming mouse with Focus Pro 30K sensor and ergonomic design",
    category: "mice",
    price: 149.99,
    url_slug: "razer-deathadder-v3-pro",
    image_url: "/images/products/deathadder-v3-pro.jpg",
    specifications: {
      "Sensor": "Focus Pro 30K",
      "DPI Range": "100-30,000",
      "Weight": "63g",
      "Battery Life": "Up to 90 hours",
      "Connectivity": "HyperSpeed Wireless",
      "Buttons": "5 Programmable Buttons"
    },
    created_at: "2023-05-10T00:00:00Z",
    updated_at: "2023-10-15T00:00:00Z",
    rating: 4.9,
    review_count: 230,
    reviews: [],
    threads: [],
    upvotes: 452,
    downvotes: 23,
    score: 429,
    rank: 1
  },
  {
    id: "logitech-g303-shroud",
    name: "Logitech G303 Shroud Edition",
    description: "Lightweight wireless gaming mouse designed in collaboration with Shroud",
    category: "mice",
    price: 129.99,
    url_slug: "logitech-g303-shroud",
    image_url: "/images/products/g303-shroud.jpg",
    specifications: {
      "Sensor": "HERO 25K",
      "DPI Range": "100-25,600",
      "Weight": "75g",
      "Battery Life": "Up to 70 hours",
      "Connectivity": "LIGHTSPEED Wireless",
      "Buttons": "6 Programmable Buttons"
    },
    created_at: "2023-03-22T00:00:00Z",
    updated_at: "2023-08-18T00:00:00Z",
    rating: 4.7,
    review_count: 185,
    reviews: [],
    threads: [],
    upvotes: 378,
    downvotes: 42,
    score: 336,
    rank: 2
  },
  {
    id: "pulsar-x2-mini",
    name: "Pulsar X2 Mini",
    description: "Ultra-lightweight symmetrical gaming mouse with 26K sensor",
    category: "mice",
    price: 94.99,
    url_slug: "pulsar-x2-mini",
    image_url: "/images/products/pulsar-x2-mini.jpg",
    specifications: {
      "Sensor": "PAW3395 26K",
      "DPI Range": "50-26,000",
      "Weight": "52g",
      "Battery Life": "Up to 70 hours",
      "Connectivity": "Wireless/Wired",
      "Buttons": "5 Programmable Buttons"
    },
    created_at: "2023-04-12T00:00:00Z",
    updated_at: "2023-09-20T00:00:00Z",
    rating: 4.8,
    review_count: 145,
    reviews: [],
    threads: [],
    upvotes: 345,
    downvotes: 15,
    score: 330,
    rank: 3
  },
  {
    id: "endgame-gear-xm1r",
    name: "Endgame Gear XM1r",
    description: "Wired gaming mouse with patented analogue switch technology",
    category: "mice",
    price: 59.99,
    url_slug: "endgame-gear-xm1r",
    image_url: "/images/products/endgame-xm1r.jpg",
    specifications: {
      "Sensor": "PixArt PAW3370",
      "DPI Range": "50-19,000",
      "Weight": "70g",
      "Cable": "Flex Cord",
      "Connectivity": "Wired",
      "Buttons": "5 Programmable Buttons"
    },
    created_at: "2023-02-08T00:00:00Z",
    updated_at: "2023-07-14T00:00:00Z",
    rating: 4.9,
    review_count: 179,
    reviews: [],
    threads: [],
    upvotes: 310,
    downvotes: 10,
    score: 300,
    rank: 4
  },
  {
    id: "steelseries-aerox-3-wireless",
    name: "SteelSeries Aerox 3 Wireless",
    description: "Ultra-lightweight wireless gaming mouse with honeycomb design",
    category: "mice",
    price: 99.99,
    url_slug: "steelseries-aerox-3-wireless",
    image_url: "/images/products/aerox-3-wireless.jpg",
    specifications: {
      "Sensor": "TrueMove Air",
      "DPI Range": "100-18,000",
      "Weight": "66g",
      "Battery Life": "Up to 200 hours",
      "Connectivity": "2.4GHz/Bluetooth 5.0",
      "Buttons": "6 Programmable Buttons"
    },
    created_at: "2023-01-30T00:00:00Z",
    updated_at: "2023-06-25T00:00:00Z",
    rating: 4.6,
    review_count: 200,
    reviews: [],
    threads: [],
    upvotes: 290,
    downvotes: 30,
    score: 260,
    rank: 5
  },
  
  // EXPANDED PRODUCT CATALOG - KEYBOARDS
  {
    id: "keychron-q1-pro",
    name: "Keychron Q1 Pro",
    description: "Wireless mechanical keyboard with QMK/VIA compatibility and aluminum frame",
    category: "keyboards",
    price: 199.99,
    url_slug: "keychron-q1-pro",
    image_url: "/images/products/keychron-q1-pro.jpg",
    specifications: {
      "Switches": "Gateron G Pro (Red, Blue, Brown)",
      "Keycaps": "Double-shot PBT",
      "Layout": "75%",
      "Connectivity": "Bluetooth 5.1, USB-C",
      "Battery": "4000mAh",
      "Features": "Hot-swappable, Gasket mount, QMK/VIA programmable"
    },
    created_at: "2023-04-15T00:00:00Z",
    updated_at: "2023-09-20T00:00:00Z",
    rating: 4.8,
    review_count: 165,
    reviews: [],
    threads: [],
    upvotes: 410,
    downvotes: 25,
    score: 385,
    rank: 1
  },
  {
    id: "wooting-60he",
    name: "Wooting 60HE",
    description: "Compact analog mechanical gaming keyboard with rapid trigger technology",
    category: "keyboards",
    price: 174.99,
    url_slug: "wooting-60he",
    image_url: "/images/products/wooting-60he.jpg",
    specifications: {
      "Switches": "Lekker (Hall Effect)",
      "Keycaps": "PBT",
      "Layout": "60%",
      "Actuation": "0.1mm to 4.0mm (adjustable)",
      "Connectivity": "USB-C",
      "Features": "Analog input, Rapid trigger, RGB lighting"
    },
    created_at: "2023-03-10T00:00:00Z",
    updated_at: "2023-08-15T00:00:00Z",
    rating: 4.9,
    review_count: 125,
    reviews: [],
    threads: [],
    upvotes: 350,
    downvotes: 18,
    score: 332,
    rank: 2
  },
  {
    id: "ducky-one-3",
    name: "Ducky One 3",
    description: "Premium mechanical keyboard with hot-swappable switches and QUACK mechanics",
    category: "keyboards",
    price: 149.99,
    url_slug: "ducky-one-3",
    image_url: "/images/products/ducky-one-3.jpg",
    specifications: {
      "Switches": "Cherry MX (Multiple options)",
      "Keycaps": "Double-shot PBT",
      "Layout": "Full-size, TKL, SF, Mini",
      "Connectivity": "USB-C",
      "Special Features": "Hot-swappable, Triple-layer dampening",
      "Lighting": "RGB"
    },
    created_at: "2023-02-25T00:00:00Z",
    updated_at: "2023-07-30T00:00:00Z",
    rating: 4.8,
    review_count: 210,
    reviews: [],
    threads: [],
    upvotes: 325,
    downvotes: 20,
    score: 305,
    rank: 3
  },
  {
    id: "gmmk-pro",
    name: "Glorious GMMK Pro",
    description: "Premium 75% mechanical keyboard with rotary knob and gasket-mounted plate",
    category: "keyboards",
    price: 169.99,
    url_slug: "gmmk-pro",
    image_url: "/images/products/gmmk-pro.jpg",
    specifications: {
      "Switches": "Hot-swappable (Not included)",
      "Keycaps": "Not included",
      "Layout": "75%",
      "Connectivity": "USB-C",
      "Special Features": "Rotary encoder, Gasket-mounted plate",
      "Case": "CNC Aluminum"
    },
    created_at: "2023-01-20T00:00:00Z",
    updated_at: "2023-06-15T00:00:00Z",
    rating: 4.7,
    review_count: 280,
    reviews: [],
    threads: [],
    upvotes: 305,
    downvotes: 30,
    score: 275,
    rank: 4
  },
  {
    id: "mode-sonnet",
    name: "Mode Sonnet",
    description: "Premium aluminum keyboard with multiple mounting configurations",
    category: "keyboards",
    price: 299.99,
    url_slug: "mode-sonnet",
    image_url: "/images/products/mode-sonnet.jpg",
    specifications: {
      "Switches": "Hot-swappable (Not included)",
      "Keycaps": "Not included",
      "Layout": "75%",
      "Connectivity": "USB-C",
      "Special Features": "Multi-mounting system, Flex cuts",
      "Case": "6063 Aluminum"
    },
    created_at: "2023-05-08T00:00:00Z",
    updated_at: "2023-10-12T00:00:00Z",
    rating: 4.9,
    review_count: 115,
    reviews: [],
    threads: [],
    upvotes: 280,
    downvotes: 15,
    score: 265,
    rank: 5
  },
  
  // EXPANDED PRODUCT CATALOG - HEADSETS
  {
    id: "audeze-maxwell",
    name: "Audeze Maxwell Wireless",
    description: "Premium wireless gaming headset with planar magnetic drivers",
    category: "headsets",
    price: 299.99,
    url_slug: "audeze-maxwell",
    image_url: "/images/products/audeze-maxwell.jpg",
    specifications: {
      "Drivers": "90mm Planar Magnetic",
      "Frequency Response": "10Hz-50kHz",
      "Battery Life": "Up to 80 hours",
      "Connectivity": "2.4GHz Wireless, Bluetooth 5.3, USB-C, 3.5mm",
      "Microphone": "Detachable boom mic with AI noise filtering",
      "Features": "Dolby Atmos, Hi-Res Audio certified"
    },
    created_at: "2023-05-20T00:00:00Z",
    updated_at: "2023-10-25T00:00:00Z",
    rating: 4.8,
    review_count: 140,
    reviews: [],
    threads: [],
    upvotes: 390,
    downvotes: 15,
    score: 375,
    rank: 1
  },
  {
    id: "steelseries-arctis-nova-pro",
    name: "SteelSeries Arctis Nova Pro Wireless",
    description: "Premium wireless gaming headset with hot-swappable batteries and active noise cancellation",
    category: "headsets",
    price: 349.99,
    url_slug: "steelseries-arctis-nova-pro",
    image_url: "/images/products/arctis-nova-pro.jpg",
    specifications: {
      "Drivers": "40mm High Fidelity",
      "Frequency Response": "10Hz-40kHz",
      "Battery Life": "Infinite (dual battery system)",
      "Connectivity": "2.4GHz Wireless, Bluetooth 5.0, USB-C",
      "Microphone": "ClearCast Gen 2 retractable mic",
      "Features": "Active Noise Cancellation, Transparency Mode"
    },
    created_at: "2023-04-05T00:00:00Z",
    updated_at: "2023-09-10T00:00:00Z",
    rating: 4.7,
    review_count: 210,
    reviews: [],
    threads: [],
    upvotes: 365,
    downvotes: 28,
    score: 337,
    rank: 2
  },
  {
    id: "beyerdynamic-mmx300",
    name: "Beyerdynamic MMX 300",
    description: "Premium audiophile-grade wired gaming headset with studio-quality sound",
    category: "headsets",
    price: 299.00,
    url_slug: "beyerdynamic-mmx300",
    image_url: "/images/products/beyerdynamic-mmx300.jpg",
    specifications: {
      "Drivers": "Dynamic Tesla Neodymium",
      "Frequency Response": "5Hz-35kHz",
      "Impedance": "32 ohms",
      "Connectivity": "3.5mm, 6.35mm adapter included",
      "Microphone": "Cardioid condenser boom mic",
      "Features": "Closed-back design, Velour ear pads, Made in Germany"
    },
    created_at: "2023-02-10T00:00:00Z",
    updated_at: "2023-07-15T00:00:00Z",
    rating: 4.9,
    review_count: 125,
    reviews: [],
    threads: [],
    upvotes: 320,
    downvotes: 10,
    score: 310,
    rank: 3
  },
  {
    id: "sennheiser-pc38x",
    name: "Sennheiser PC38X",
    description: "Open-back gaming headset with exceptional soundstage and comfort",
    category: "headsets",
    price: 169.00,
    url_slug: "sennheiser-pc38x",
    image_url: "/images/products/sennheiser-pc38x.jpg",
    specifications: {
      "Drivers": "45mm high-fidelity",
      "Frequency Response": "10Hz-30kHz",
      "Impedance": "28 ohms",
      "Connectivity": "3.5mm split or combo",
      "Microphone": "Noise-cancelling broadcast quality flip-to-mute",
      "Features": "Open-back design, Velour ear pads, Split audio/mic cables"
    },
    created_at: "2023-03-15T00:00:00Z",
    updated_at: "2023-08-20T00:00:00Z",
    rating: 4.8,
    review_count: 220,
    reviews: [],
    threads: [],
    upvotes: 298,
    downvotes: 12,
    score: 286,
    rank: 4
  },
  {
    id: "hyperx-cloud-alpha",
    name: "HyperX Cloud Alpha Wireless",
    description: "Gaming headset with 300-hour battery life and DTS spatial audio",
    category: "headsets",
    price: 199.99,
    url_slug: "hyperx-cloud-alpha-wireless",
    image_url: "/images/products/hyperx-cloud-alpha-wireless.jpg",
    specifications: {
      "Drivers": "50mm DTS Headphone:X",
      "Frequency Response": "15Hz-21kHz",
      "Battery Life": "Up to 300 hours",
      "Connectivity": "2.4GHz Wireless",
      "Microphone": "Detachable noise-cancelling",
      "Features": "Dual chamber drivers, Memory foam ear cushions, Aluminum frame"
    },
    created_at: "2023-01-25T00:00:00Z",
    updated_at: "2023-06-30T00:00:00Z",
    rating: 4.7,
    review_count: 245,
    reviews: [],
    threads: [],
    upvotes: 285,
    downvotes: 18,
    score: 267,
    rank: 5
  }
];

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/products called');
    
    const clientId = getClientId();
    
    // Add URL slug validation - make sure all products have valid slugs
    const productsWithValidSlugs = mockProducts.map(product => {
      // If product doesn't have a valid slug, generate one from the name
      if (!product.url_slug || product.url_slug.includes('undefined')) {
        return {
          ...product,
          url_slug: generateSafeSlug(product.name, product.id)
        };
      }
      return product;
    });
    
    // Get category filter from query params
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    // Filter products by category if specified
    let filteredProducts = category && category !== 'all'
      ? productsWithValidSlugs.filter(p => p.category === category)
      : productsWithValidSlugs;
      
    // Get vote state to add vote counts
    try {
      const voteState = await getVoteState();
      
      // Enhance products with vote data
      filteredProducts = filteredProducts.map(product => {
        const voteCounts = voteState.voteCounts[product.id] || { upvotes: 0, downvotes: 0 };
        const voteKey = `${product.id}:${clientId}`;
        const userVote = voteState.votes[voteKey] || null;
        const score = voteCounts.upvotes - voteCounts.downvotes;
        
        return {
          ...product,
          upvotes: voteCounts.upvotes,
          downvotes: voteCounts.downvotes,
          userVote,
          score
        };
      });
      
      // Sort by score (descending)
      filteredProducts.sort((a, b) => (b.score || 0) - (a.score || 0));
      
    } catch (error) {
      console.error('Error enhancing products with vote data:', error);
      // Continue with the original products if vote data can't be retrieved
    }
    
    return NextResponse.json({
      success: true,
      products: filteredProducts
    });
    
  } catch (error) {
    console.error('Error in GET /api/products:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch products',
      products: []
    }, { status: 500 });
  }
} 