"use client";
import React from "react";
import { ShieldCheck, Cloud, Cpu, Search, ArrowRight, Zap, Globe, Lock } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: <ShieldCheck className="w-12 h-12 text-blue-600" />,
      title: "Enterprise-Grade Security",
      description:
        "End-to-end encryption with zero-knowledge architecture ensures your files remain private and safe.",
      highlight: "256-bit encryption"
    },
    {
      icon: <Cloud className="w-12 h-12 text-purple-600" />,
      title: "Scalable Cloud Storage",
      description:
        "Store and access your data anytime with scalable infrastructure designed for growth.",
      highlight: "99.9% uptime"
    },
    {
      icon: <Cpu className="w-12 h-12 text-indigo-600" />,
      title: "AI-Powered Management",
      description:
        "Smart file organization and insights powered by machine learning to optimize your workflow.",
      highlight: "Auto-categorization"
    },
    {
      icon: <Search className="w-12 h-12 text-green-600" />,
      title: "Advanced Search & Retrieval",
      description:
        "Quickly find and retrieve files with powerful search capabilities and metadata tagging.",
      highlight: "Instant results"
    },
  ];

  const stats = [
    {
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      value: "1GB",
      label: "Free Storage",
      color: "text-blue-600"
    },
    {
      icon: <Cpu className="w-8 h-8 text-violet-600" />,
      value: "AI-Powered",
      label: "Smart Organization",
      color: "text-violet-600"
    },
    {
      icon: <Globe className="w-8 h-8 text-cyan-600" />,
      value: "Anywhere",
      label: "Access Your Files",
      color: "text-cyan-600"
    }
  ];

  return (
    <section className="relative py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section Heading */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              NeuroVault?
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Designed for modern teams, developers, and businesses who care about
            security, scalability, and efficiency.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100/50"
            >
              {/* Gradient border effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 p-4 bg-gray-50/80 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {feature.description}
                </p>
                <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  <Lock className="w-3 h-3 mr-1" />
                  {feature.highlight}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-10 border border-gray-100/50">
          <div className="grid md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gray-50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    {stat.icon}
                  </div>
                </div>
                <div className={`text-4xl font-bold mb-2 ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-lg text-gray-700 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
          
          {/* Call to action */}
          <div className="text-center mt-10 pt-8 border-t border-gray-200">
            <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-500">
            &copy; 2025 NeuroVault. All rights reserved.
          </p>
        </div>
      </div>
    </section>
  );
}