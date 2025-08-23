import HeroSection from "@/components/Hero";
import NavBar from "@/components/NavBar";
import Image from "next/image";
import Features from "@/components/Features";

export default function Home() {
  return (
    <div>
      <NavBar/>
      <HeroSection/>
      <Features/>
    </div>
  );
}
