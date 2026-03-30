import Link from "next/link";
import { Instagram, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#2d2d2d] text-white pt-14 pb-6">
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <h2 className="text-3xl font-extrabold italic mb-3">KidSafe</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Developed and maintained by Aderline Gashugi.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mt-2">
              We aim to ease the process it takes to find safe and reliable homes for orphans and street kids.
            </p>
          </div>

          {/* Links col 1 */}
          <div className="flex flex-col gap-3">
            <a href="#stories" className="text-gray-300 hover:text-white text-sm font-semibold transition">
              Our Stories
            </a>
            <a href="#mission" className="text-gray-300 hover:text-white text-sm font-semibold transition">
              Our Mission
            </a>
            <a href="#children" className="text-gray-300 hover:text-white text-sm font-semibold transition">
              Our Children
            </a>
          </div>

          {/* Links col 2 */}
          <div className="flex flex-col gap-3">
            <a href="#how-it-works" className="text-gray-300 hover:text-white text-sm font-semibold transition">
              How it works
            </a>
            <a href="#contact" className="text-gray-300 hover:text-white text-sm font-semibold transition">
              Contact us
            </a>
            <div className="flex gap-2 text-sm">
              <a href="#" className="text-[#6c63ff] hover:underline">Terms of use</a>
              <span className="text-gray-500">|</span>
              <a href="#" className="text-[#6c63ff] hover:underline">Privacy Policy</a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-600 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-xs">
            Copyright &copy; Aderline 2026. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {[Instagram, Twitter, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition"
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
