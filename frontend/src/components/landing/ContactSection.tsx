"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function ContactSection() {
  const [form, setForm] = useState({ email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ email: "", message: "" });
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-1">Contact us</h2>
        <div className="w-16 h-1 bg-[#6c63ff] mb-12" />

        <div className="flex flex-col md:flex-row items-center gap-16">
          {/* Form */}
          <div className="flex-1 max-w-sm w-full">
            <p className="text-sm text-gray-500 mb-4">Leave us a message!</p>

            {submitted && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded">
                Message sent! We&apos;ll get back to you soon.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="flex-1 px-3 py-2.5 text-sm outline-none bg-white"
                />
                <div className="px-3 bg-gray-100 border-l border-gray-200 h-full flex items-center py-2.5">
                  <Send size={14} className="text-gray-400" />
                </div>
              </div>

              <textarea
                placeholder="Message..."
                rows={5}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                required
                className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm outline-none resize-none"
              />

              <button
                type="submit"
                className="w-full py-3 bg-[#6c63ff] text-white font-bold text-sm rounded hover:bg-[#5a52d5] transition"
              >
                Submit
              </button>
            </form>
          </div>

          {/* Illustration */}
          <div className="flex-1 hidden md:flex justify-center">
            <img
              src="https://res.cloudinary.com/dutseqfmu/image/upload/v1774865878/Contact_us_1_jpoxst.png"
              alt="Contact us"
              className="w-80 object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
