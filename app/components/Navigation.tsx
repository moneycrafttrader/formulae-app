"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "./Button";

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/calculator", label: "Calculator" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <nav className="bg-[#0a0a0a] border-b border-gray-800 shadow-lg shadow-black/50 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#00ff88]">MF</span>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white leading-tight">MAGIC FORMULAE</span>
                <span className="text-xs text-[#00ff88] leading-tight">Powered by Sure Profit India</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-[#00ff88] bg-[#00ff88]/10"
                    : "text-white hover:text-[#00ff88] hover:bg-[#00ff88]/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Button
              variant="primary"
              as="a"
              href="/signup"
              className="hidden sm:inline-flex items-center gap-1"
            >
              Get Started →
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

