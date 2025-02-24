import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import Logo from "../assets/Logo";

interface HeaderProps {
  showSignOut?: boolean;
  onSignOut?: () => void;
  userEmail?: string;
}

export default function Header({
  showSignOut,
  onSignOut,
  userEmail,
}: HeaderProps) {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const LogoSection = () => (
    <div className="flex items-center gap-4">
      <Logo />
      <div>
        <h1 className="text-3xl font-black text-black">Flippl.app</h1>
        <p className="text-black font-medium">
          Flip your trades. Track your P/L.
        </p>
      </div>
    </div>
  );

  return (
    <div className="mb-8">
      <div className="neo-brutalist-white p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          {isHomePage ? (
            <LogoSection />
          ) : (
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <LogoSection />
            </Link>
          )}
          {showSignOut && onSignOut && userEmail && (
            <div className="flex justify-end">
              <Popover.Root>
                <Popover.Trigger asChild>
                  <button className="neo-brutalist-yellow px-4 py-2 font-bold text-black flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Account
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    className="neo-brutalist-white p-4 z-50"
                    sideOffset={8}
                    align="end"
                  >
                    <div className="w-64 space-y-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-600">
                          Logged in as
                        </div>
                        <div className="font-bold text-black break-all">
                          {userEmail}
                        </div>
                      </div>
                      <div className="flex justify-end pt-4 pb-2 border-t-4 border-black">
                        <button
                          onClick={onSignOut}
                          className="neo-brutalist-red px-4 py-2 font-bold text-white flex items-center justify-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                    <Popover.Arrow className="fill-black" />
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
