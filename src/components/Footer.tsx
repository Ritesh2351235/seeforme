
import React from 'react';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';

const Footer = () => {
  return (
    <footer className="py-8 px-4 md:px-8 border-t border-gray-200">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="mb-6 md:mb-0">
          <p className="text-lg font-bold">SeeForMe</p>
          <p className="text-sm text-gray-500">© 2025 SeeForMe. All rights reserved.</p>
        </div>
        <Separator className="md:hidden mb-6" />
        <div className="flex space-x-8">
          <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-700 transition">
            Privacy
          </Link>
          <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-700 transition">
            Terms
          </Link>
          <Link to="/contact" className="text-sm text-gray-500 hover:text-gray-700 transition">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
