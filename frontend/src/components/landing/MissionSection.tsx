export default function MissionSection() {
  return (
    <section id="mission" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-1">Our Mission</h2>
        <div className="w-16 h-1 bg-[#6c63ff] mb-12" />

        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Text box — overlapping purple card */}
          <div className="relative flex-1 min-h-[280px]">
            <div className="absolute inset-0 md:right-[-40px] bg-[#e8e6ff] rounded-br-[60px] z-0" />
            <div className="relative z-10 p-10 max-w-xs">
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                Provide a home to boys, girls and young adults who are in orphanages all around Rwanda.
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                We aim to help them towards their regular growth development, surpass any possible traumas and ultimately guide them to reclaim their lives.
              </p>
            </div>
          </div>

          {/* Video thumbnail */}
          <div className="relative flex-1 rounded-xl overflow-hidden shadow-lg min-h-[250px]">
            <img
              src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80"
              alt="Our Mission"
              className="w-full h-64 object-cover"
            />
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center shadow-lg cursor-pointer hover:bg-white transition">
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[18px] border-l-[#6c63ff] ml-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
