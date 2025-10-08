"use client";
import React from "react";
import Link from "next/link";
import { SignInButton, SignedOut, SignedIn } from "@clerk/nextjs"
export default function Hero() {
  
  return (
    <section className="relative bg-gradient-to-b from-gray-50 to-white pt-24 pb-5">
      <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
        
        {/* Heading */}
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-gray-900">
          Secure Your Data with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
            NeuroVault
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg text-gray-600 max-w-2xl">
          Protect, manage, and scale your digital assets with enterprise-grade
          security. The future of safe storage starts here.
        </p>

        {/* --- UPDATED BUTTONS --- */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          
          {/* This button will only show if the user is signed OUT */}
          <SignedOut>
            <SignInButton>
              <button className="px-6 py-3 rounded-lg text-white font-medium bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md hover:scale-105 hover:shadow-lg transition cursor-pointer">
                🚀 Get Started
              </button>
            </SignInButton>
          </SignedOut>

          {/* This button will only show if the user is signed IN */}
          <SignedIn>
            <Link 
              href="/dashboard"
              className="px-6 py-3 rounded-lg text-white font-medium bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md hover:scale-105 hover:shadow-lg transition"
            >
              🚀 Go to Dashboard
            </Link>
          </SignedIn>
          
          <a
            href="/features"
            className="px-6 py-3 rounded-lg font-medium text-gray-700 border border-gray-300 hover:bg-blue-50 hover:text-blue-600 transition"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}