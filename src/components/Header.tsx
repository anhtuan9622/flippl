import React from 'react';
import { Calendar as CalendarIcon, LogOut } from 'lucide-react';

interface HeaderProps {
  showSignOut?: boolean;
  onSignOut?: () => void;
}

export default function Header({ showSignOut, onSignOut }: HeaderProps) {
  return (
    <div className="mb-8">
      <div className="neo-brutalist-white p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 neo-brutalist-gray flex items-center justify-center">
              <CalendarIcon className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-black">
                Flippl.app
              </h1>
              <p className="text-black font-medium">
                Flip your trades. Track your P/L.
              </p>
            </div>
          </div>
          {showSignOut && onSignOut && (
            <button
              onClick={onSignOut}
              className="neo-brutalist-red px-4 py-2 font-bold text-white flex items-center gap-2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}