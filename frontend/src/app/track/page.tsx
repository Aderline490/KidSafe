"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, CheckCircle2, XCircle, Clock } from "lucide-react";

interface TrackResult {
  applicationNumber: string;
  status: string;
  adoptionType: string;
  submittedAt: string;
  updatedAt: string;
  applicantFirstName: string;
  child: {
    firstName: string;
    district: string;
    photo: string;
  };
}

const STATUS_STEPS = [
  { key: "submitted", label: "Submitted", desc: "Application received and queued for review." },
  { key: "home_visit_scheduled", label: "Home Visit Scheduled", desc: "A social worker will visit your home." },
  { key: "home_visit_completed", label: "Home Visit Done", desc: "Assessment report completed." },
  { key: "level1_approved", label: "Social Worker", desc: "Approved by social worker." },
  { key: "level2_approved", label: "Commissioner", desc: "Approved by district commissioner." },
  { key: "level3_approved", label: "NCDA", desc: "Approved by NCDA official." },
  { key: "approved", label: "Approved!", desc: "Adoption fully approved. Congratulations!" },
];

const REJECTED_STATUSES = [
  "rejected",
  "level1_rejected",
  "level2_rejected",
  "level3_rejected",
  "withdrawn",
];

function getStepIndex(status: string) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function adoptionTypeLabel(type: string) {
  if (type === "foster_care") return "Foster Care";
  if (type === "emergent") return "Emergent Adoption";
  return "Permanent Adoption";
}

function daysSince(dateStr: string) {
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function TrackContent() {
  const searchParams = useSearchParams();
  const prefilled = searchParams.get("app") ?? "";

  const [appNumber, setAppNumber] = useState(prefilled);
  const [nationalId, setNationalId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState("");

  // Auto-search if app number came from URL and user types their national ID
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setResult(null);

    if (!appNumber.trim() || !nationalId.trim()) {
      setError("Please enter both your application number and national ID.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/proposals/track?app=${encodeURIComponent(appNumber.trim())}&nationalId=${encodeURIComponent(nationalId.trim())}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isRejected = result && REJECTED_STATUSES.includes(result.status);
  const isApproved = result?.status === "approved";
  const stepIdx = result ? getStepIndex(result.status) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold text-[#6c63ff]">
            KidSafe
          </Link>
          <div className="flex gap-3 text-sm">
            <Link href="/explore" className="text-gray-500 hover:text-[#6c63ff]">
              Browse Children
            </Link>
            <Link href="/login" className="text-gray-500 hover:text-[#6c63ff]">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Track Your Application
          </h1>
          <p className="text-gray-500 mt-2">
            Enter your application number and national ID to check your status.
          </p>
        </div>

        {/* Search form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="appNumber">Application Number</Label>
              <Input
                id="appNumber"
                placeholder="e.g. KS-2024-00001"
                value={appNumber}
                onChange={(e) => setAppNumber(e.target.value)}
                className="font-mono tracking-wider"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nationalId">National ID Number</Label>
              <Input
                id="nationalId"
                placeholder="16-digit national ID"
                maxLength={16}
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-[#6c63ff] hover:bg-[#5a52d5] gap-2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {loading ? "Searching..." : "Check Status"}
            </Button>
          </form>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Child + header */}
            <div
              className={`px-6 py-5 flex items-center gap-4 ${
                isApproved
                  ? "bg-green-50 border-b border-green-100"
                  : isRejected
                  ? "bg-red-50 border-b border-red-100"
                  : "bg-[#6c63ff]/5 border-b border-[#6c63ff]/10"
              }`}
            >
              <img
                src={result.child.photo}
                alt={result.child.firstName}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <p className="font-bold text-gray-900">
                  Application for {result.child.firstName}
                </p>
                <p className="text-sm text-gray-500">
                  {result.child.district} · {adoptionTypeLabel(result.adoptionType)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Submitted {daysSince(result.submittedAt)} days ago
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">Application No.</p>
                <p className="font-mono font-bold text-[#6c63ff] text-sm">
                  {result.applicationNumber}
                </p>
              </div>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Status banner */}
              {isApproved && (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-green-800">
                      Adoption Fully Approved!
                    </p>
                    <p className="text-sm text-green-600 mt-0.5">
                      Congratulations, {result.applicantFirstName}! A
                      coordinator will contact you within 48 hours about
                      placement.
                    </p>
                  </div>
                </div>
              )}

              {isRejected && (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                  <XCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-red-700">
                      Application Not Approved
                    </p>
                    <p className="text-sm text-red-500 mt-0.5">
                      Your application was not approved at this time. Please
                      contact our office for more information.
                    </p>
                  </div>
                </div>
              )}

              {!isApproved && !isRejected && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <Clock className="h-6 w-6 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-amber-800">In Progress</p>
                    <p className="text-sm text-amber-600 mt-0.5">
                      {STATUS_STEPS[stepIdx]?.desc}
                    </p>
                  </div>
                </div>
              )}

              {/* Progress tracker */}
              {!isRejected && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                    Progress
                  </p>
                  <div className="flex items-start">
                    {STATUS_STEPS.map((step, i) => {
                      const done = i <= stepIdx;
                      const current = i === stepIdx && !isApproved;
                      return (
                        <div key={step.key} className="flex items-center flex-1">
                          <div className="flex flex-col items-center flex-1">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                done
                                  ? "bg-[#6c63ff] border-[#6c63ff] text-white"
                                  : "bg-white border-gray-200 text-gray-400"
                              } ${current ? "ring-4 ring-[#6c63ff]/20" : ""}`}
                            >
                              {done ? "✓" : i + 1}
                            </div>
                            <span
                              className={`text-[9px] mt-1.5 text-center leading-tight max-w-[60px] ${
                                done
                                  ? "text-[#6c63ff] font-semibold"
                                  : "text-gray-400"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div
                              className={`h-0.5 flex-1 -mt-5 ${
                                i < stepIdx ? "bg-[#6c63ff]" : "bg-gray-200"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Last updated */}
              <p className="text-xs text-muted-foreground text-center">
                Last updated:{" "}
                {new Date(result.updatedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        )}

        {/* Help text */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Don't have an application yet?{" "}
          <Link href="/explore" className="text-[#6c63ff] hover:underline">
            Browse children
          </Link>{" "}
          to apply. Questions? Email{" "}
          <a
            href="mailto:support@kidsafe.rw"
            className="text-[#6c63ff] hover:underline"
          >
            support@kidsafe.rw
          </a>
        </p>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-[#6c63ff]" />
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
