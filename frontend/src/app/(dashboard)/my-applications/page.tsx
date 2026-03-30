"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  HeartHandshake,
} from "lucide-react";
import api from "@/lib/api";

interface Proposal {
  id: string;
  status: string;
  motivation?: string;
  submittedAt: string;
  createdAt: string;
  child: {
    id: string;
    firstName: string;
    photo: string;
    district: string;
    dateOfBirth: string;
    gender: string;
  };
}

const STATUS_STEPS = [
  { key: "submitted", label: "Submitted", desc: "Your request has been received." },
  { key: "home_visit_scheduled", label: "Home Visit Scheduled", desc: "A social worker will visit your home." },
  { key: "home_visit_completed", label: "Home Visit Done", desc: "Home visit assessment completed." },
  { key: "level1_approved", label: "Social Worker", desc: "Approved by assigned social worker." },
  { key: "level2_approved", label: "Commissioner", desc: "Approved by district commissioner." },
  { key: "level3_approved", label: "NCDA", desc: "Approved by NCDA official." },
  { key: "approved", label: "Approved", desc: "Adoption fully approved. Congratulations!" },
];

const TERMINAL_STATUSES = ["rejected", "level1_rejected", "level2_rejected", "level3_rejected", "withdrawn"];

function getStepIndex(status: string) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function getAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function StatusIcon({ status }: { status: string }) {
  if (status === "approved") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (TERMINAL_STATUSES.includes(status)) return <XCircle className="h-4 w-4 text-red-400" />;
  return <Clock className="h-4 w-4 text-amber-500" />;
}

function StatusLabel({ status }: { status: string }) {
  if (status === "approved") return <Badge className="bg-green-100 text-green-700 border-0">Approved</Badge>;
  if (TERMINAL_STATUSES.includes(status)) return <Badge className="bg-red-100 text-red-600 border-0">Not Approved</Badge>;
  const step = STATUS_STEPS.find((s) => s.key === status);
  return <Badge className="bg-amber-100 text-amber-700 border-0">{step?.label ?? "In Review"}</Badge>;
}

function adoptionTypeLabel(type?: string) {
  if (type === "foster_care") return "Foster Care";
  if (type === "emergent") return "Emergent Adoption";
  return "Permanent Adoption";
}

export default function MyApplicationsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/proposals/my")
      .then((r) => setProposals(r.data.proposals ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track the status of all your adoption requests.
          </p>
        </div>
        <Link href="/explore">
          <Button className="bg-[#6c63ff] hover:bg-[#5a52d5] gap-2">
            <Search className="h-4 w-4" />
            New Application
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center py-16 gap-4 text-center">
            <HeartHandshake className="h-12 w-12 text-gray-300" />
            <p className="text-base font-semibold text-gray-500">No applications yet</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Browse children available for adoption and click "Adopt" to start your first application.
            </p>
            <Link href="/explore">
              <Button className="bg-[#6c63ff] hover:bg-[#5a52d5]">Browse Children</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => {
            const isExpanded = expanded === p.id;
            const isTerminal = TERMINAL_STATUSES.includes(p.status);
            const isApproved = p.status === "approved";
            const stepIdx = getStepIndex(p.status);
            const days = daysSince(p.submittedAt || p.createdAt);

            return (
              <Card key={p.id} className={`shadow-sm overflow-hidden ${isApproved ? "border-green-200" : isTerminal ? "border-red-200" : ""}`}>
                {/* Header row */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpanded(isExpanded ? null : p.id)}
                >
                  <img
                    src={p.child.photo}
                    alt={p.child.firstName}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-foreground">{p.child.firstName}</p>
                      <StatusLabel status={p.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getAge(p.child.dateOfBirth)} yrs · {p.child.district} · {adoptionTypeLabel((p as any).adoptionType)}
                    </p>
                    <p className="text-xs text-muted-foreground">Submitted {days} day{days !== 1 ? "s" : ""} ago</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusIcon status={p.status} />
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border px-5 py-5 space-y-5 bg-gray-50/50">
                    {/* Progress tracker */}
                    {!isTerminal ? (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                          Application Progress
                        </p>
                        <div className="flex items-start gap-0">
                          {STATUS_STEPS.map((step, i) => {
                            const done = i <= stepIdx;
                            const current = i === stepIdx;
                            return (
                              <div key={step.key} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                                      done
                                        ? "bg-[#6c63ff] border-[#6c63ff] text-white"
                                        : "bg-white border-gray-200 text-gray-400"
                                    } ${current ? "ring-4 ring-[#6c63ff]/20" : ""}`}
                                  >
                                    {done ? "✓" : i + 1}
                                  </div>
                                  <span
                                    className={`text-[9px] mt-1.5 text-center leading-tight max-w-[56px] ${
                                      done ? "text-[#6c63ff] font-medium" : "text-gray-400"
                                    }`}
                                  >
                                    {step.label}
                                  </span>
                                  {current && (
                                    <span className="text-[8px] text-amber-500 font-medium mt-0.5">← Current</span>
                                  )}
                                </div>
                                {i < STATUS_STEPS.length - 1 && (
                                  <div
                                    className={`h-0.5 flex-1 -mt-6 ${i < stepIdx ? "bg-[#6c63ff]" : "bg-gray-200"}`}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                          {STATUS_STEPS[stepIdx]?.desc}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-100">
                        <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-red-700">Application not approved</p>
                          <p className="text-xs text-red-500 mt-0.5">
                            You may apply for a different child. Contact your social worker for details.
                          </p>
                        </div>
                      </div>
                    )}

                    {isApproved && (
                      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-green-700">Adoption fully approved!</p>
                          <p className="text-xs text-green-600 mt-0.5">
                            Congratulations! Your social worker will contact you about the next steps for placement.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Motivation preview */}
                    {p.motivation && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Your Motivation</p>
                        <p className="text-sm text-foreground leading-relaxed line-clamp-3">{p.motivation}</p>
                      </div>
                    )}

                    {/* Document reminder for in-review */}
                    {!isTerminal && !isApproved && stepIdx >= 1 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                        <p className="font-semibold mb-1">Action required: Prepare your documents</p>
                        <p>Your home visit is coming up. Make sure you have: National ID, passport photo, criminal record certificate, and proof of income ready.</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
