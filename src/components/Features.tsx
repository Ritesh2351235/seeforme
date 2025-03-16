
import React from 'react';
import { Camera, MessageCircle, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const features = [
  {
    icon: <Camera className="w-8 h-8" />,
    title: "Real-time Vision",
    description: "Advanced computer vision that sees and understands your surroundings in real-time."
  },
  {
    icon: <MessageCircle className="w-8 h-8" />,
    title: "Natural Conversation",
    description: "Interact naturally through voice commands and receive clear, contextual responses."
  },
  {
    icon: <Award className="w-8 h-8" />,
    title: "Always Free",
    description: "No subscriptions or hidden fees. SeeForMe is and will always be free for everyone."
  }
];

const Features = () => {
  return (
    <section id="features" className="py-16 md:py-24 px-4 md:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          Helping You Navigate the World
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border-none shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <CardHeader className="pb-2">
                <div className="p-3 w-fit rounded-full bg-black text-white mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
