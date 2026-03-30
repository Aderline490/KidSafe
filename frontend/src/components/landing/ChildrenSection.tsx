"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const children = [
  {
    name: "Amina Uwase",
    age: 8,
    gender: "Female",
    location: "Kigali",
    photo: "https://res.cloudinary.com/dutseqfmu/image/upload/v1774865640/Rectangle_92_rmq5co.png",
  },
  {
    name: "David Nkurunziza",
    age: 11,
    gender: "Male",
    location: "Musanze",
    photo: "https://res.cloudinary.com/dutseqfmu/image/upload/v1774865607/child_4_uq0kr4.png",
  },
  {
    name: "Grace Mutoni",
    age: 6,
    gender: "Female",
    location: "Huye",
    photo: "https://res.cloudinary.com/dutseqfmu/image/upload/v1774865607/child_3_lwrobc.png",
  },
  {
    name: "Eric Habimana",
    age: 14,
    gender: "Male",
    location: "Rubavu",
    photo: "https://res.cloudinary.com/dutseqfmu/image/upload/v1774865607/child_2_xojcjy.png",
  },
];

const VISIBLE = 4; // show all 4 at once

export default function ChildrenSection() {
  const [start, setStart] = useState(0);

  const canPrev = start > 0;
  const canNext = start + VISIBLE < children.length;

  return (
    <section id="children" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-1">Our Children</h2>
        <div className="w-16 h-1 bg-[#6c63ff] mb-12" />

        <div className="relative flex items-center gap-4">
          {/* Prev arrow */}
          <button
            onClick={() => setStart((s) => s - 1)}
            disabled={!canPrev}
            className="flex-shrink-0 w-10 h-10 rounded-full border border-[#6c63ff] flex items-center justify-center text-[#6c63ff] disabled:opacity-30 hover:bg-[#6c63ff] hover:text-white transition"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Cards */}
          <div className="flex gap-4 overflow-hidden flex-1">
            {children.slice(start, start + VISIBLE).map((child, i) => (
              <div
                key={i}
                className="flex-1 min-w-0 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
              >
                <div className="relative">
                  <img
                    src={child.photo}
                    alt={child.name}
                    className="w-full h-44 object-cover"
                  />
                  <span className="absolute top-2 right-2 text-xs font-semibold text-gray-700 bg-white/90 px-2 py-0.5 rounded">
                    {child.location}
                  </span>
                </div>
                <div className="p-3">
                  <p className="font-bold text-sm text-gray-900">{child.name}</p>
                  <p className="text-xs text-gray-500">{child.age} years old</p>
                  <p className="text-xs text-gray-400 capitalize mb-3">{child.gender}</p>
                  <div className="flex items-center justify-between">
                    <Link
                      href="/register"
                      className="px-3 py-1.5 bg-[#6c63ff] text-white text-xs font-bold rounded hover:bg-[#5a52d5] transition"
                    >
                      Adopt
                    </Link>
                    <button className="text-xs text-gray-500 hover:text-[#6c63ff] transition font-semibold">
                      Donate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Next arrow */}
          <button
            onClick={() => setStart((s) => s + 1)}
            disabled={!canNext}
            className="flex-shrink-0 w-10 h-10 rounded-full border border-[#6c63ff] flex items-center justify-center text-[#6c63ff] disabled:opacity-30 hover:bg-[#6c63ff] hover:text-white transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="text-center mt-10">
          <Link
            href="/register"
            className="inline-block px-10 py-3 bg-[#6c63ff] text-white font-bold text-sm rounded hover:bg-[#5a52d5] transition"
          >
            See more
          </Link>
        </div>
      </div>
    </section>
  );
}
