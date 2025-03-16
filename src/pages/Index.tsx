
import React from 'react';
import Navbar from '@/components/Navbar';
import { Hero } from '@/components/ui/animated-hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import Testimonial from '@/components/Testimonial';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Features />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
