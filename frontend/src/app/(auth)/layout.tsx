export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold italic text-primary">Homely</h1>
          <p className="text-muted-foreground mt-2">
            Child Welfare Management System
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
