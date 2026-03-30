const stats = [
  { value: "50+", label: "Families Have adopted Kids" },
  { value: "130+", label: "Kids Found families" },
  { value: "170+", label: "Kids Haven't found homes" },
];

export default function StatsSection() {
  return (
    <section className="bg-[#6c63ff] py-12">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center divide-y md:divide-y-0 md:divide-x divide-white/30">
        {stats.map((stat, i) => (
          <div key={i} className="flex-1 text-center py-6 md:py-0 px-8">
            <p className="text-4xl font-extrabold text-white">{stat.value}</p>
            <p className="mt-1 text-white/80 font-semibold text-sm">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
