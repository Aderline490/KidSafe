export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f9] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold italic text-[#6c63ff]">
            KidSafe
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Child Welfare Management System
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
