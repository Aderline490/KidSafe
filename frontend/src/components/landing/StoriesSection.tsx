"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const stories = [
  {
    name: "Aderline Gashugi",
    location: "Kigali, Rwanda",
    photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&auto=format&fit=crop&q=80",
    quote:
      "Just after the separation of my parents, life became difficult and after my father died, my life became even more difficult and I began thinking perhaps I wasn't meant to be happy. Life has its reasons which only God knows. In this world; love, affection or money can take the second place because man...",
  },
  {
    name: "Jean Pierre Mugisha",
    location: "Butare, Rwanda",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&auto=format&fit=crop&q=80",
    quote:
      "Growing up without parents was the hardest thing I ever experienced. But finding a family through KidSafe changed everything. Now I have people who love me unconditionally and I finally feel at home...",
  },
  {
    name: "Marie Claire Uwera",
    location: "Musanze, Rwanda",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&auto=format&fit=crop&q=80",
    quote:
      "I spent years in an orphanage wondering if anyone would ever want me. KidSafe gave me hope. Today I am part of a loving family and pursuing my education. This platform truly changes lives...",
  },
];

export default function StoriesSection() {
  const [current, setCurrent] = useState(1);

  const prev = () => setCurrent((c) => (c - 1 + stories.length) % stories.length);
  const next = () => setCurrent((c) => (c + 1) % stories.length);

  const getIndex = (offset: number) =>
    (current + offset + stories.length) % stories.length;

  return (
    <section id="stories" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-1">Our Stories</h2>
        <div className="w-16 h-1 bg-[#6c63ff] mb-12" />

        <div className="flex items-center justify-center gap-6 mb-10">
          {/* Prev */}
          <button onClick={prev} className="text-[#6c63ff] hover:opacity-70 transition">
            <ChevronLeft size={32} />
          </button>

          {/* Left small */}
          <div className="hidden sm:block w-14 h-14 rounded-full overflow-hidden opacity-50 flex-shrink-0">
            <img
              src={stories[getIndex(-1)].photo}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>

          {/* Center large */}
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#6c63ff] flex-shrink-0">
            <img
              src={stories[current].photo}
              alt={stories[current].name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right small */}
          <div className="hidden sm:block w-14 h-14 rounded-full overflow-hidden opacity-50 flex-shrink-0">
            <img
              src={stories[getIndex(1)].photo}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>

          {/* Next */}
          <button onClick={next} className="text-[#6c63ff] hover:opacity-70 transition">
            <ChevronRight size={32} />
          </button>
        </div>

        {/* Story content */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="font-bold text-lg text-gray-900">{stories[current].name}</p>
          <p className="text-gray-400 text-sm mb-6">{stories[current].location}</p>
          <div className="relative">
            <span className="absolute -top-4 -left-2 text-6xl text-gray-200 font-serif leading-none">&ldquo;</span>
            <p className="text-gray-600 text-sm leading-relaxed px-6">
              {stories[current].quote}
              <button className="text-[#6c63ff] font-semibold ml-1 hover:underline">
                Read More
              </button>
            </p>
            <span className="absolute -bottom-6 -right-2 text-6xl text-gray-200 font-serif leading-none">&rdquo;</span>
          </div>
        </div>
      </div>
    </section>
  );
}
