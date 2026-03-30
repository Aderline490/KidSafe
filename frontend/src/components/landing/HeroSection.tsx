import Link from "next/link";
import { Instagram, Twitter, Linkedin, Mail, Phone } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative h-screen min-h-[600px] flex items-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://res.cloudinary.com/dutseqfmu/image/upload/v1774865072/landing_page_bg_wauzqv.png')",
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Social icons sidebar */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-4 bg-white/10 backdrop-blur-sm py-4 px-2 rounded-r-lg z-10">
        {[
          { icon: Instagram, href: "#" },
          { icon: Twitter, href: "#" },
          { icon: Linkedin, href: "#" },
          { icon: Mail, href: "#" },
          { icon: Phone, href: "#" },
        ].map(({ icon: Icon, href }, i) => (
          <a
            key={i}
            href={href}
            className="text-white hover:text-[#c4b5fd] transition-colors"
          >
            <Icon size={18} />
          </a>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center text-center px-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight uppercase max-w-4xl">
          In the heart of every child is hunger for a home
        </h1>
        <p className="mt-4 text-white/80 text-lg max-w-xl">
          Children without families are the most vulnerable in the world.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-block px-12 py-3 bg-[#6c63ff] text-white font-bold text-sm tracking-widest uppercase rounded hover:bg-[#5a52d5] transition-colors"
        >
          Adopt Now!
        </Link>
      </div>
    </section>
  );
}
