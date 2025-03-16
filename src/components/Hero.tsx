import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  return (
    <section className="flex flex-col items-center justify-center py-20 md:py-32 px-4 md:px-8 text-center animate-fade-in bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Your AI-Powered Visual Assistant
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          SeeForMe uses advanced AI to help you understand your surroundings through natural conversation. Just point your camera and ask.
        </p>
        <div className="flex justify-center">
          <Button
            className="bg-black hover:bg-gray-800 text-white px-8 py-6 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Launch App
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
