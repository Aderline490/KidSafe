"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, HeartHandshake, XCircle } from "lucide-react";

function FamilyRegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inviteToken = searchParams.get("token");

  const [invite, setInvite] = useState<{ email: string } | null>(null);
  const [inviteError, setInviteError] = useState("");
  const [isVerifying, setIsVerifying] = useState(true);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", password: "", confirmPassword: "", phone: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!inviteToken) { setInviteError("No invite token found in this link."); setIsVerifying(false); return; }
    api.get(`/auth/verify-invite?token=${inviteToken}`)
      .then((res) => setInvite({ email: res.data.email }))
      .catch((err) => setInviteError(err.response?.data?.message || "Invalid or expired invite link."))
      .finally(() => setIsVerifying(false));
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) { setError("Passwords do not match"); return; }
    if (formData.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setIsLoading(true);
    try {
      const res = await api.post("/auth/register-staff", {
        inviteToken,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        phone: formData.phone || undefined,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/overview");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="py-12 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Verifying your invite...</p>
        </CardContent>
      </Card>
    );
  }

  if (inviteError) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
          <XCircle className="h-10 w-10 text-destructive" />
          <h2 className="font-bold text-lg">Invalid Link</h2>
          <p className="text-muted-foreground text-sm">{inviteError}</p>
          <Link href="/login"><Button variant="outline">Go to Login</Button></Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
          <HeartHandshake className="h-6 w-6 text-green-600" />
        </div>
        <CardTitle className="text-2xl font-bold">Create Your Family Account</CardTitle>
        <p className="text-muted-foreground text-sm mt-1">
          Your adoption has been approved. Set up your account to track your child's placement and submit monthly reports.
        </p>
        <p className="text-xs font-medium text-primary mt-1">{invite!.email}</p>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="Your first name" value={formData.firstName}
                onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Your last name" value={formData.lastName}
                onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" type="tel" placeholder="+250 7XX XXX XXX" value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min 8 characters"
                value={formData.password}
                onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData((p) => ({ ...p, confirmPassword: e.target.value }))} required />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : "Create My Account"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function FamilyRegisterPage() {
  return (
    <Suspense fallback={
      <Card className="shadow-lg border-0">
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    }>
      <FamilyRegisterForm />
    </Suspense>
  );
}
