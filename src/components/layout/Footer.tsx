import React from "react";
import { Lightbulb, Github, Mail, Coffee } from "lucide-react";
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

          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            <a
              href="https://www.producthunt.com/posts/flippl-app?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-flippl&#0045;app"
              target="_blank"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=910431&theme=neutral&t=1742590442516"
                alt="Flippl&#0046;app - Flip&#0032;your&#0032;trades&#0046;&#0032;Track&#0032;your&#0032;P&#0047;L&#0046; | Product Hunt"
                width="222"
                height="54"
              />
            </a>

            <div className="flex items-center gap-4">
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <a
                      href="https://insigh.to/b/flipplapp"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="primary" icon={Lightbulb} />
                    </a>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="neo-brutalist-yellow px-3 py-2 text-sm font-bold text-black"
                      sideOffset={5}
                    >
                      Suggest a feature
                      <Tooltip.Arrow className="fill-black" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>

                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <a
                      href="https://github.com/anhtuan9622/flippl"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="primary" icon={Github} />
                    </a>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="neo-brutalist-yellow px-3 py-2 text-sm font-bold text-black"
                      sideOffset={5}
                    >
                      Visit GitHub
                      <Tooltip.Arrow className="fill-black" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>

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
      </div>
    </footer>
  );
}
