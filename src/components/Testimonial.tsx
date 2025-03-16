
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Testimonial = () => {
  return (
    <section className="py-20 md:py-28 px-4 md:px-8 bg-black text-white">
      <Card className="max-w-4xl mx-auto bg-transparent border-none text-center">
        <CardContent className="pt-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Start Using SeeForMe Today
          </h2>
          <p className="text-xl mb-10 text-gray-300">
            Join thousands of users who rely on SeeForMe for understanding their visual world.
          </p>
          <Button className="bg-white text-black hover:bg-gray-200 font-medium px-8 py-6 rounded-lg text-lg transition-all duration-300 shadow-lg hover:shadow-xl">
            Launch App
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};

export default Testimonial;
