import {
  Github,
  Heart,
  Info,
  Mail,
  MessageCircle,
  Shield,
  Twitter,
  Youtube,
} from "lucide-react";

interface FooterPresenterProps {
  currentYear: number;
  onLinkClick: (link: string) => void;
}

export const FooterPresenter = ({
  currentYear,
  onLinkClick,
}: FooterPresenterProps) => {
  const footerLinks = {
    about: [
      { name: "About VSPO Collection", href: "/about", icon: Info },
      { name: "Features", href: "/features", icon: Heart },
      { name: "FAQ", href: "/faq", icon: MessageCircle },
      { name: "Contact", href: "/contact", icon: Mail },
    ],
    legal: [
      { name: "Terms of Service", href: "/terms", icon: Shield },
      { name: "Privacy Policy", href: "/privacy", icon: Shield },
      { name: "Guidelines", href: "/guidelines", icon: Shield },
      { name: "Copyright", href: "/copyright", icon: Shield },
    ],
    community: [
      { name: "Discord", href: "#", icon: MessageCircle },
      { name: "Twitter", href: "#", icon: Twitter },
      { name: "YouTube", href: "#", icon: Youtube },
      { name: "GitHub", href: "#", icon: Github },
    ],
  };

  return (
    <footer className="bg-gradient-to-b from-purple-900/50 to-black/90 backdrop-blur-lg border-t border-white/10 safe-area-bottom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center transform rotate-3">
                <span className="text-2xl">🎬</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  VSPO Collection
                </h3>
                <p className="text-sm text-white/60">推しコレ</p>
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              VSPOメンバーの切り抜き動画を みんなで楽しむプラットフォーム。
              推しの最高の瞬間を共有しよう！
            </p>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Heart className="w-4 h-4 text-pink-400" />
              <span>Made with love for VSPO fans</span>
            </div>
          </div>

          {/* About Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">About</h4>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.name}>
                  <button
                    type="button"
                    onClick={() => onLinkClick(link.name)}
                    className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <button
                    type="button"
                    onClick={() => onLinkClick(link.name)}
                    className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Community</h4>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.name}>
                  <button
                    type="button"
                    onClick={() => onLinkClick(link.name)}
                    className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-sm text-white/60 text-center md:text-left">
              <p>© {currentYear} VSPO Collection. All rights reserved.</p>
              <p className="mt-1">
                VSPO! and related marks are trademarks of their respective
                owners.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => onLinkClick("Discord")}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                aria-label="Discord"
              >
                <MessageCircle className="w-5 h-5 text-white" />
              </button>
              <button
                type="button"
                onClick={() => onLinkClick("Twitter")}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 text-white" />
              </button>
              <button
                type="button"
                onClick={() => onLinkClick("YouTube")}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5 text-white" />
              </button>
              <button
                type="button"
                onClick={() => onLinkClick("GitHub")}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
