import { Github } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full border-t bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by{" "}
            <Link
              href="/"
              className="font-medium underline underline-offset-4 transition-colors hover:text-[#ff4b26]"
            >
              Gaming Gear
            </Link>
            . The source code is available on{" "}
            <Link
              href="https://github.com"
              className="font-medium underline underline-offset-4 transition-colors hover:text-[#ff4b26]"
            >
              GitHub
              <Github className="ml-1 inline-block h-4 w-4" />
            </Link>
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <nav className="flex gap-4">
            <Link
              href="/about"
              className="text-sm font-medium underline-offset-4 hover:text-[#ff4b26] hover:underline"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="text-sm font-medium underline-offset-4 hover:text-[#ff4b26] hover:underline"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm font-medium underline-offset-4 hover:text-[#ff4b26] hover:underline"
            >
              Terms
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
} 