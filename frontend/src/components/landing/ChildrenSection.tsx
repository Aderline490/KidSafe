"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Child {
  id: string;
  firstName: string;
  age: number;
  gender: string;
  district: string;
  photo: string;
}

const VISIBLE = 4;

export default function ChildrenSection() {
  const [children, setChildren] = useState<Child[]>([]);
  const [start, setStart] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/children?limit=8`)
      .then((r) => r.json())
      .then((data) => {
        setChildren(data.children ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const canPrev = start > 0;
  const canNext = start + VISIBLE < children.length;

  return (
    <section id="children" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-1">Our Children</h2>
        <div className="w-16 h-1 bg-[#6c63ff] mb-12" />

        {loading ? (
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-1 h-64 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="relative flex items-center gap-4">
            <button
              onClick={() => setStart((s) => s - 1)}
              disabled={!canPrev}
              className="flex-shrink-0 w-10 h-10 rounded-full border border-[#6c63ff] flex items-center justify-center text-[#6c63ff] disabled:opacity-30 hover:bg-[#6c63ff] hover:text-white transition"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex gap-4 overflow-hidden flex-1">
              {children.slice(start, start + VISIBLE).map((child) => (
                <div
                  key={child.id}
                  className="flex-1 min-w-0 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
                >
                  <div className="relative">
                    <img
                      src={child.photo}
                      alt={child.firstName}
                      className="w-full h-44 object-cover"
                    />
                    <span className="absolute top-2 right-2 text-xs font-semibold text-gray-700 bg-white/90 px-2 py-0.5 rounded">
                      {child.district}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm text-gray-900">{child.firstName}</p>
                    <p className="text-xs text-gray-500">{child.age} years old</p>
                    <p className="text-xs text-gray-400 capitalize mb-3">{child.gender}</p>
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/propose/${child.id}`}
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

            <button
              onClick={() => setStart((s) => s + 1)}
              disabled={!canNext}
              className="flex-shrink-0 w-10 h-10 rounded-full border border-[#6c63ff] flex items-center justify-center text-[#6c63ff] disabled:opacity-30 hover:bg-[#6c63ff] hover:text-white transition"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            href="/explore"
            className="inline-block px-10 py-3 bg-[#6c63ff] text-white font-bold text-sm rounded hover:bg-[#5a52d5] transition"
          >
            See more
          </Link>
        </div>
      </div>
    </section>
  );
}
