"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function NavBar() {
  const Links = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
  ];

  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 shadow-sm border-b border-gray-100">
      <nav className="relative px-6 lg:px-12">
        <div className="flex justify-between items-center h-16 max-w-7xl mx-auto">
          
          {/* Logo */}
          <Link
            href="/"
            className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 font-extrabold text-2xl hover:opacity-90 transition"
          >
            NeuroVault
          </Link>

          {/* --- DESKTOP MENU (Visible on 'md' screens and up) --- */}
          <div className="hidden md:flex items-center gap-6">
            {Links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            <SignedOut>
              <SignInButton>
                <button className="px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-700 hover:text-blue-600 hover:bg-blue-50 cursor-pointer">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>

          {/* --- MOBILE MENU TRIGGER (Visible on screens smaller than 'md') --- */}
          <div className="flex items-center gap-4 md:hidden">
            {/* When signed in, the UserButton appears directly in the header */}
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            
            {/* The hamburger button to toggle the dropdown menu */}
            <button
              className="p-2 rounded-md text-gray-700 hover:bg-blue-50 transition"
              aria-expanded={isOpen}
              onClick={() => setIsOpen((prev) => !prev)}
            >
              <span className="sr-only">Toggle Menu</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* --- MOBILE DROPDOWN MENU --- */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="flex flex-col p-3 space-y-2 bg-white shadow-lg border-t rounded-b-lg">
            {Links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setIsOpen(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === l.href
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                {l.label}
              </Link>
            ))}

            {/* When signed out, the Sign In button lives inside the dropdown */}
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </nav>
    </header>
  );
}