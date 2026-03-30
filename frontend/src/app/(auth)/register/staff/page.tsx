"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  social_worker: "Social Worker",
  orphanage_admin: "Orphanage Administrator",
  district_commissioner: "District Commissioner",
  ncda_official: "NCDA Official",
  system_admin: "System Administrator",
};

function StaffRegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inviteToken = searchParams.get("token");

  const [invite, setInvite] = useState<{ email: string; role: string } | null>(null);
  const [inviteError, setInviteError] = useState("");
  const [isVerifying, setIsVerifying] = useState(true);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Verify invite token on mount
  useEffect(() => {
    if (!inviteToken) {
      setInviteError("No invite token provided.");
      setIsVerifying(false);
      return;
    }

    api
      .get(`/auth/verify-invite?token=${inviteToken}`)
      .then((res) => {
        setInvite({ email: res.data.email, role: res.data.role });
      })
      .catch((err) => {
        setInviteError(
          err.response?.data?.message || "Invalid or expired invite link."
        );
      })
      .finally(() => setIsVerifying(false));
  }, [inviteToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/auth/register-staff", {
        inviteToken,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        phone: formData.phone || undefined,
      });

      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
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
          <p className="text-muted-foreground text-sm">Verifying invite...</p>
        </CardContent>
      </Card>
    );
  }

  if (inviteError) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
          <XCircle className="h-10 w-10 text-destructive" />
          <h2 className="font-bold text-lg">Invalid Invite</h2>
          <p className="text-muted-foreground text-sm">{inviteError}</p>
          <Link href="/login">
            <Button variant="outline">Go to Login</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <CheckCircle className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Complete Your Account</CardTitle>
        <p className="text-muted-foreground text-sm">
          You&apos;ve been invited as{" "}
          <span className="font-semibold text-primary">
            {ROLE_LABELS[invite!.role] || invite!.role}
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">{invite!.email}</p>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+250 7XX XXX XXX"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 characters"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up account...
              </>
            ) : (
              "Complete Registration"
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function StaffRegisterPage() {
  return (
    <Suspense fallback={
      <Card className="shadow-lg border-0">
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    }>
      <StaffRegisterForm />
    </Suspense>
  );
}
