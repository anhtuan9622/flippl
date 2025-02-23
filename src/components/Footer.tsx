import React from 'react';
import { Github, Mail, Coffee } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { getVersion } from '../lib/version';

export default function Footer() {
  return (
    <footer className="mt-8 pb-4">
      <div className="neo-brutalist-white p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm font-medium text-gray-600">
            © {new Date().getFullYear()} Flippl.app. All rights reserved. v{getVersion()}
          </div>
          
          <div className="flex items-center gap-4">
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <a
                    href="mailto:hey@flippl.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-brutalist-blue p-2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="neo-brutalist-white px-3 py-2 text-sm font-bold text-black"
                    sideOffset={5}
                  >
                    Email me
                    <Tooltip.Arrow className="fill-black" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
              
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <a
                    href="https://www.buymeacoffee.com/flippl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-brutalist-blue p-2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Coffee className="w-5 h-5" />
                  </a>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="neo-brutalist-white px-3 py-2 text-sm font-bold text-black"
                    sideOffset={5}
                  >
                    Buy me a coffee
                    <Tooltip.Arrow className="fill-black" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>
        </div>
      </div>
    </footer>
  );
}