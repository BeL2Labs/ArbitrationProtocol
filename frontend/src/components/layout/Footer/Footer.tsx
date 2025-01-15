import Github from "@/assets/github.svg";
import Telegram from "@/assets/telegram.svg";
import Twitter from "@/assets/twitter.svg";
import { Button } from "@/components/ui/button";
import { FC } from "react";
import { Link } from "react-router-dom";

const socials = [
  {
    icon: Github,
    link: "https://github.com/orgs/BeL2Labs",
  },
  {
    icon: Twitter,
    link: "https://twitter.com/Be_Layer2",
  },
  {
    icon: Telegram,
    link: "https://t.me/elastosgroup/1",
  },
];

export const Footer: FC = () => {
  return (
    <footer className="flex justify-center px-4 py-2 text-sm w-full gap-4 pb-10">
      <div className="h-full">
        <div className="font-bold text-lg mb-2">Socials</div>
        <div className="flex items-center justify-center content-center gap-0 w-full">
          {socials.map(({ icon, link }, i) => (
            <Button key={i} asChild variant="ghost" size="icon">
              <Link to={link} target="_blank" className="p-0 px-1">
                <img src={icon} height={50} />
              </Link>
            </Button>
          ))}
        </div>
      </div>
      <div className="flex flex-col">
        <div className="font-bold text-lg mb-2">Discover</div>
        <div className="flex flex-row gap-2 items-center justify-center flex-1">
          <Link to="https://bel2.org/" target="_blank" className="">BeL2</Link>
          |
          <Link to="https://lending.bel2.org/" target="_blank" className="">BeL2 Lending</Link>
          |
          <Link to="https://elastos.info/" target="_blank" className="">Elastos.info</Link>
        </div>
      </div>
    </footer>
  );
};