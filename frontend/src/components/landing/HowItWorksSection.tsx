import Link from "next/link";

const steps = [
  {
    number: 1,
    title: "Search for a child of your choice",
    description: "Search over a hundred kids for those who match your criteria",
    illustration: "https://res.cloudinary.com/dutseqfmu/image/upload/v1774865879/illustration_1_k0jzuc.png",
    reverse: false,
  },
  {
    number: 2,
    title: "View the child's details",
    description: "View the kids' details and choose who to adopt according to your choice.",
    illustration: "https://res.cloudinary.com/dutseqfmu/image/upload/v1774865879/illustration_2_lqehqf.png",
    reverse: true,
  },
  {
    number: 3,
    title: "Send your request",
    description: "After viewing the available kids, choose who to adopt and fill a form requesting the kid with your information.",
    illustration: "https://res.cloudinary.com/dutseqfmu/image/upload/v1774865879/illustration_3_q3zjxe.png",
    reverse: false,
  },
  {
    number: 4,
    title: "Get the child",
    description: "After we have viewed your request and confirmed your eligibility to take care of the child, your request will be approved and you'll be good to go.",
    illustration: "https://res.cloudinary.com/dutseqfmu/image/upload/v1774865879/illustration_4_t8veai.png",
    reverse: true,
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-16">
          How it works
        </h2>

        <div className="space-y-12">
          {steps.map((step, i) => (
            <div key={i}>
              <div
                className={`flex flex-col md:flex-row items-center gap-8 ${
                  step.reverse ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Text card */}
                <div className="flex-1 border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-3">
                    <span className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-sm font-bold text-gray-500">
                      {step.number}
                    </span>
                    <h3 className="font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Illustration */}
                <div className="flex-1 flex justify-center">
                  <img
                    src={step.illustration}
                    alt={step.title}
                    className="w-48 h-40 object-cover rounded-xl opacity-80"
                  />
                </div>
              </div>

              {/* Arrow between steps */}
              {i < steps.length - 1 && (
                <div
                  className={`flex mt-4 ${
                    i % 2 === 0 ? "justify-end pr-[42%]" : "justify-start pl-[42%]"
                  }`}
                >
                  <span className="text-[#6c63ff] text-2xl rotate-[15deg]">↙</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <Link
            href="/register"
            className="inline-block px-10 py-3 bg-[#6c63ff] text-white font-bold text-sm rounded hover:bg-[#5a52d5] transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}
