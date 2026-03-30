"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Stories", href: "#stories" },
  { label: "Mission", href: "#mission" },
  { label: "Explore", href: "#children" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Donate", href: "#contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-5">
      {/* Logo */}
      <Link href="/" className="text-3xl font-extrabold italic text-white">
        KidSafe
      </Link>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-sm font-semibold text-white hover:text-[#6c63ff] transition-colors"
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Login Button */}
      <div className="hidden md:block">
        <Link
          href="/login"
          className="px-5 py-2 bg-[#6c63ff] text-white text-sm font-semibold rounded hover:bg-[#5a52d5] transition-colors"
        >
          Login
        </Link>
      </div>

      {/* Mobile menu toggle */}
      <button
        className="md:hidden text-white"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#1a1a2e]/95 backdrop-blur px-8 py-6 flex flex-col gap-4 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-white text-sm font-semibold hover:text-[#6c63ff] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            className="mt-2 px-5 py-2 bg-[#6c63ff] text-white text-sm font-semibold rounded text-center hover:bg-[#5a52d5] transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Login
          </Link>
        </div>
      )}
    </nav>
  );
}
