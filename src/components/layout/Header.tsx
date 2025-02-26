import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, User, Mail, ChevronDown, Lightbulb, Lock } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import Button from "../ui/Button";
import Logo from "../../assets/Logo";
import EmailChangeModal from "../modals/EmailChangeModal";

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
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

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
                <Popover.Trigger>
                  <Button
                    variant="select"
                    icon={User}
                    iconPosition="left"
                  >
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
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
                      <div className="space-y-4 pt-4 border-t-4 border-black">
                        <div className="flex flex-wrap justify-end gap-2">
                          <a
                            href="https://insigh.to/b/flipplapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            <Button
                              variant="primary"
                              icon={Lightbulb}
                              size="sm"
                            >
                              Suggest features
                            </Button>
                          </a>
                          <Button
                            variant="primary"
                            icon={Mail}
                            size="sm"
                            onClick={() => setIsEmailModalOpen(true)}
                          >
                            Change Email
                          </Button>
                          <Button
                            variant="danger"
                            icon={LogOut}
                            size="sm"
                            onClick={onSignOut}
                          >
                            Sign Out
                          </Button>
                        </div>
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

      {userEmail && (
        <EmailChangeModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          currentEmail={userEmail}
        />
      )}
    </div>
  );
}