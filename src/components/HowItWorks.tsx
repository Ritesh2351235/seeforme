
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const steps = [
  {
    number: "01",
    title: "Point your camera",
    description: "Simply point your device's camera at what you want to understand or identify."
  },
  {
    number: "02",
    title: "Ask naturally",
    description: "Use your voice to ask about what's in front of you in normal, conversational language."
  },
  {
    number: "03",
    title: "Get instant guidance",
    description: "Receive clear audio descriptions and guidance based on what the camera sees."
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 md:py-24 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          How SeeForMe Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <Card 
              key={index} 
              className="border-none bg-white hover:bg-gray-50 transition-all duration-300 animate-fade-up" 
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <CardHeader>
                <span className="text-5xl font-bold text-black/10">{step.number}</span>
                <CardTitle className="text-xl font-semibold mt-4">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
