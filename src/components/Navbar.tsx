import React from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const handleGetApp = () => {
    navigate('/dashboard');
  };

  return (
    <nav className="w-full py-4 px-4 md:px-8 flex items-center justify-between border-b border-gray-200">
      <div className="flex items-center">
        <Link to="/">
          <span className="text-xl md:text-2xl font-bold tracking-tight">SeeForMe</span>
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        <Link to="/" className="hidden md:block font-medium text-sm hover:text-gray-600 transition">
          Home
        </Link>
        <Link
          to="/#features"
          className="hidden md:block font-medium text-sm hover:text-gray-600 transition"
          onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Features
        </Link>
        <Link
          to="/#how-it-works"
          className="hidden md:block font-medium text-sm hover:text-gray-600 transition"
          onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
        >
          How It Works
        </Link>
        <Button variant="outline" className="text-sm font-medium" onClick={handleGetApp}>
          Launch App
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
