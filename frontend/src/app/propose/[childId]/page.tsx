"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle2, Copy, Check } from "lucide-react";

interface Child {
  id: string;
  firstName: string;
  age: number;
  gender: string;
  district: string;
  photo: string;
  background: string;
  orphanageName: string;
  isInSchool: boolean;
  hasInsurance: boolean;
}

const ADOPTION_TYPES = [
  {
    value: "permanent",
    label: "Permanent Adoption",
    description:
      "Full legal guardianship — the child becomes a permanent member of your family.",
  },
  {
    value: "foster_care",
    label: "Foster Care (Short-term)",
    description:
      "Temporary care while a permanent solution is found. Duration varies.",
  },
  {
    value: "emergent",
    label: "Emergent Adoption",
    description:
      "Urgent placement due to immediate risk or crisis situation.",
  },
];

export default function ProposePage() {
  const { childId } = useParams<{ childId: string }>();

  const [child, setChild] = useState<Child | null>(null);
  const [childLoading, setChildLoading] = useState(true);
  const [applicationNumber, setApplicationNumber] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    // Personal info
    applicantFirstName: "",
    applicantLastName: "",
    applicantEmail: "",
    applicantPhone: "",
    applicantNationalId: "",
    // Application details
    adoptionType: "",
    motivation: "",
    housingDescription: "",
    numberOfPeopleInHousehold: "",
    hasOtherChildren: false,
    monthlyIncome: "",
  });

  useEffect(() => {
    if (!childId) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/children/${childId}`)
      .then((r) => r.json())
      .then((data) => setChild(data))
      .catch(() => {})
      .finally(() => setChildLoading(false));
  }, [childId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const value =
      target.type === "checkbox" ? target.checked : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.adoptionType) {
      setError("Please select an adoption type.");
      return;
    }
    if (!/^\d{16}$/.test(form.applicantNationalId)) {
      setError("National ID must be exactly 16 digits.");
      return;
    }
    if (form.motivation.trim().length < 50) {
      setError("Please write at least 50 characters for your motivation.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/proposals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ childId, ...form }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setApplicationNumber(data.applicationNumber);
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyNumber = () => {
    if (!applicationNumber) return;
    navigator.clipboard.writeText(applicationNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (childLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#6c63ff]" />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500">Child not found or no longer available.</p>
        <Link href="/explore">
          <Button variant="outline">Browse other children</Button>
        </Link>
      </div>
    );
  }

  // Success state
  if (applicationNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-6 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Application Submitted!
            </h2>
            <p className="text-gray-500 mt-2">
              Your adoption application for{" "}
              <strong>{child.firstName}</strong> has been received. A
              confirmation has been sent to{" "}
              <strong>{form.applicantEmail}</strong>.
            </p>
          </div>

          {/* Application number — prominent */}
          <div className="bg-[#6c63ff]/5 border-2 border-dashed border-[#6c63ff] rounded-xl p-6">
            <p className="text-xs font-bold text-[#6c63ff] uppercase tracking-widest mb-2">
              Your Application Number
            </p>
            <p className="text-3xl font-black text-[#6c63ff] tracking-widest mb-3">
              {applicationNumber}
            </p>
            <button
              onClick={copyNumber}
              className="flex items-center gap-1.5 mx-auto text-xs text-[#6c63ff] hover:underline"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied!" : "Copy number"}
            </button>
          </div>

          <p className="text-sm text-gray-500">
            Save this number — you will need it to track the progress of your
            application. You will also receive email updates at every stage.
          </p>

          <div className="flex flex-col gap-3">
            <Link href={`/track?app=${applicationNumber}`}>
              <Button className="w-full bg-[#6c63ff] hover:bg-[#5a52d5]">
                Track My Application
              </Button>
            </Link>
            <Link href="/explore">
              <Button variant="outline" className="w-full">
                Back to Explore
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/explore" className="text-sm text-[#6c63ff] hover:underline">
            ← Back to explore
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-2">
            Adoption Application
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            No account needed — fill in your details below to apply.
          </p>
        </div>

        {/* Child summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex gap-4 items-center">
          <img
            src={child.photo}
            alt={child.firstName}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          />
          <div>
            <p className="font-bold text-gray-900 text-lg">{child.firstName}</p>
            <p className="text-sm text-gray-500">
              {child.age} years old · {child.gender} · {child.district}
            </p>
            <p className="text-sm text-gray-400">{child.orphanageName}</p>
            <div className="flex gap-1 mt-1">
              {child.isInSchool && (
                <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                  In school
                </span>
              )}
              {child.hasInsurance && (
                <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
                  Insured
                </span>
              )}
            </div>
          </div>
        </div>

        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg">Your Application</CardTitle>
            <p className="text-sm text-muted-foreground">
              A social worker will review your request and contact you within
              5–7 business days.
            </p>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Section: Personal info */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Your Information
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="applicantFirstName">First Name</Label>
                      <Input
                        id="applicantFirstName"
                        name="applicantFirstName"
                        placeholder="Jean"
                        value={form.applicantFirstName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="applicantLastName">Last Name</Label>
                      <Input
                        id="applicantLastName"
                        name="applicantLastName"
                        placeholder="Uwera"
                        value={form.applicantLastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="applicantNationalId">National ID Number</Label>
                    <Input
                      id="applicantNationalId"
                      name="applicantNationalId"
                      placeholder="16-digit national ID"
                      maxLength={16}
                      value={form.applicantNationalId}
                      onChange={handleChange}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be exactly 16 digits. Used to track your application.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="applicantEmail">Email Address</Label>
                    <Input
                      id="applicantEmail"
                      name="applicantEmail"
                      type="email"
                      placeholder="jean@example.com"
                      value={form.applicantEmail}
                      onChange={handleChange}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Your application number and status updates will be sent here.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="applicantPhone">Phone Number (optional)</Label>
                    <Input
                      id="applicantPhone"
                      name="applicantPhone"
                      type="tel"
                      placeholder="+250 7XX XXX XXX"
                      value={form.applicantPhone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Section: Adoption type */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Type of Adoption
                </p>
                <div className="grid gap-3">
                  {ADOPTION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          adoptionType: type.value,
                        }))
                      }
                      className={`text-left w-full rounded-lg border px-4 py-3 transition ${
                        form.adoptionType === type.value
                          ? "border-[#6c63ff] bg-[#6c63ff]/5 ring-1 ring-[#6c63ff]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p
                        className={`font-semibold text-sm ${
                          form.adoptionType === type.value
                            ? "text-[#6c63ff]"
                            : "text-gray-800"
                        }`}
                      >
                        {type.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {type.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section: About your family */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  About Your Family
                </p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="motivation">
                      Why do you want to adopt {child.firstName}?
                    </Label>
                    <Textarea
                      id="motivation"
                      name="motivation"
                      placeholder="Tell us about your motivation, your family situation, and why you believe you can provide a loving home..."
                      rows={5}
                      value={form.motivation}
                      onChange={handleChange}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 50 characters · {form.motivation.length} written
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="housingDescription">Describe your home</Label>
                    <Textarea
                      id="housingDescription"
                      name="housingDescription"
                      placeholder="Number of rooms, neighbourhood, outdoor space, etc."
                      rows={3}
                      value={form.housingDescription}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="numberOfPeopleInHousehold">
                        People in household
                      </Label>
                      <Input
                        id="numberOfPeopleInHousehold"
                        name="numberOfPeopleInHousehold"
                        type="number"
                        min="1"
                        placeholder="e.g. 3"
                        value={form.numberOfPeopleInHousehold}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="monthlyIncome">Monthly income (RWF)</Label>
                      <Input
                        id="monthlyIncome"
                        name="monthlyIncome"
                        type="number"
                        min="0"
                        placeholder="e.g. 500000"
                        value={form.monthlyIncome}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      id="hasOtherChildren"
                      name="hasOtherChildren"
                      type="checkbox"
                      className="w-4 h-4 accent-[#6c63ff]"
                      checked={form.hasOtherChildren}
                      onChange={handleChange}
                    />
                    <Label htmlFor="hasOtherChildren" className="cursor-pointer">
                      I already have other children in my household
                    </Label>
                  </div>
                </div>
              </div>

              {/* Document notice */}
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <p className="font-semibold mb-1">Documents required at next stage</p>
                <p className="text-xs text-amber-700">
                  After your request is reviewed and accepted by a social
                  worker, you will be asked to submit: national ID scan, passport
                  photo, and a criminal record certificate. Please prepare these
                  documents.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                className="w-full bg-[#6c63ff] hover:bg-[#5a52d5]"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Adoption Application"
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                By submitting, you confirm that all information provided is
                accurate and truthful.
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
