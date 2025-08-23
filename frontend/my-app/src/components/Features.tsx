"use client";
import React from "react";
import { ShieldCheck, Cloud, Cpu } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: <ShieldCheck className="w-10 h-10 text-blue-600" />,
      title: "Enterprise-Grade Security",
      description:
        "End-to-end encryption with zero-knowledge architecture ensures your files remain private and safe.",
    },
    {
      icon: <Cloud className="w-10 h-10 text-purple-600" />,
      title: "Scalable Cloud Storage",
      description:
        "Store and access your data anytime with scalable infrastructure designed for growth.",
    },
    {
      icon: <Cpu className="w-10 h-10 text-indigo-600" />,
      title: "AI-Powered Management",
      description:
        "Smart file organization and insights powered by machine learning to optimize your workflow.",
    },
  ];

  return (
    <section className="relative py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
        
        {/* Section Heading */}
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
          Why Choose <span className="text-blue-600">NeuroVault?</span>
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Designed for modern teams, developers, and businesses who care about
          security, scalability, and efficiency.
        </p>

        {/* Feature Grid */}
        <div className="mt-16 grid gap-12 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-2xl shadow hover:shadow-lg transition"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-3 text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
