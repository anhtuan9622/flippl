import React from "react";
import { Mail, Coffee } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { getVersion } from "../../lib/version";
import Button from "../ui/Button";

export default function Footer() {
  return (
    <footer className="mt-8 pb-4">
      <div className="neo-brutalist-white p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm font-medium text-gray-600">
            Flippl.app v{getVersion()}
          </div>

          <div className="flex items-center gap-4">
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <a
                    href="mailto:hey@flippl.app"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="primary" icon={Mail} />
                  </a>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="neo-brutalist-yellow px-3 py-2 text-sm font-bold text-black"
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
                  >
                    <Button variant="primary" icon={Coffee} />
                  </a>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="neo-brutalist-yellow px-3 py-2 text-sm font-bold text-black"
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
