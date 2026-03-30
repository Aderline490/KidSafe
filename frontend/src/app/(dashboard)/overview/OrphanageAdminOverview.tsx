"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Baby, ClipboardList, Heart, CheckCircle2, Plus,
  ArrowRight, ChevronRight, AlertCircle, Building2, Clock,
} from "lucide-react";
import api from "@/lib/api";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  district: string;
  dateOfBirth: string;
  photo?: string;
  createdById: string;
}

interface Proposal {
  id: string;
  applicationNumber: string;
  status: string;
  adoptionType: string;
  submittedAt: string;
  applicantFirstName: string;
  applicantLastName: string;
  assignedSocialWorker: { firstName: string; lastName: string } | null;
  child: { id: string; firstName: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700",
  home_visit_scheduled: "bg-amber-100 text-amber-700",
  home_visit_completed: "bg-purple-100 text-purple-700",
  level1_approved: "bg-green-100 text-green-700",
  level2_approved: "bg-teal-100 text-teal-700",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
};

function statusLabel(s: string) {
  const map: Record<string, string> = {
    submitted: "Submitted", home_visit_scheduled: "Visit Scheduled",
    home_visit_completed: "Visit Done", level1_approved: "SW Approved",
    level2_approved: "DC Approved", approved: "Fully Approved", rejected: "Rejected",
  };
  return map[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function daysSince(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
}

export default function OrphanageAdminOverview() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/staff/children"),
      api.get("/staff/proposals"),
    ])
      .then(([cRes, pRes]) => {
        setChildren(cRes.data.children ?? []);
        setProposals(pRes.data.proposals ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Children this orphanage admin added
  const myChildren = children.filter((c) => c.createdById === user?.id);
  const myChildIds = new Set(myChildren.map((c) => c.id));

  // Proposals for this orphanage's children
  const myProposals = proposals.filter((p) => p.child && myChildIds.has(p.child.id));

  const available = myChildren.filter((c) => c.status === "available").length;
  const placed = myChildren.filter((c) => c.status === "adopted" || c.status === "matched").length;
  const pending = myProposals.filter((p) => !["approved", "rejected"].includes(p.status)).length;
  const unassigned = myProposals.filter((p) => p.status === "submitted" && !p.assignedSocialWorker);

  const stats = [
    { label: "Children in Care", value: myChildren.length, icon: Baby, color: "bg-[#6c63ff]/10", iconColor: "text-[#6c63ff]", sub: `${available} available for adoption` },
    { label: "Active Proposals", value: pending, icon: ClipboardList, color: "bg-amber-100", iconColor: "text-amber-600", sub: `${unassigned.length} need a social worker` },
    { label: "Placed Children", value: placed, icon: Heart, color: "bg-green-100", iconColor: "text-green-600", sub: "Adopted or matched" },
    { label: "Fully Approved", value: myProposals.filter((p) => p.status === "approved").length, icon: CheckCircle2, color: "bg-blue-100", iconColor: "text-blue-600", sub: "Completed adoptions" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, {user?.firstName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Orphanage management dashboard</p>
        </div>
        <Link href="/kids">
          <Button className="bg-[#6c63ff] hover:bg-[#5a52d5] gap-2">
            <Plus className="h-4 w-4" /> Add Child
          </Button>
        </Link>
      </div>

      {/* Unassigned alert */}
      {unassigned.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            {unassigned.length} proposal{unassigned.length !== 1 ? "s" : ""} for your children need a social worker assigned.
          </p>
          <Link href="/requests" className="ml-auto">
            <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100 text-xs gap-1">
              Review <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="shadow-sm">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
                  <Icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
                <p className="text-2xl font-bold">{loading ? "—" : s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                <p className="text-xs text-muted-foreground border-t border-border mt-2 pt-2">{s.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Children + Proposals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Children */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#6c63ff]" /> My Children
            </CardTitle>
            <Link href="/kids">
              <button className="text-xs text-primary hover:underline flex items-center gap-0.5">
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : myChildren.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center gap-3 text-center">
                <Baby className="h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500 font-medium">No children added yet</p>
                <Link href="/kids">
                  <Button size="sm" className="bg-[#6c63ff] hover:bg-[#5a52d5] gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add First Child
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {myChildren.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                    {c.photo ? (
                      <img src={c.photo} alt={c.firstName} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Baby className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{c.firstName} {c.lastName}</p>
                      <p className="text-xs text-muted-foreground">{getAge(c.dateOfBirth)} yrs · {c.district}</p>
                    </div>
                    <Badge className={`text-[10px] border-0 ${
                      c.status === "available" ? "bg-green-100 text-green-700" :
                      c.status === "adopted" ? "bg-blue-100 text-blue-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {c.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active proposals for my children */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[#6c63ff]" /> Adoption Proposals
            </CardTitle>
            <Link href="/requests">
              <button className="text-xs text-primary hover:underline flex items-center gap-0.5">
                Manage <ArrowRight className="h-3 w-3" />
              </button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : myProposals.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <ClipboardList className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">No proposals yet</p>
                <p className="text-xs text-muted-foreground mt-1">Proposals appear once families apply for your children.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {myProposals.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{p.applicantFirstName} {p.applicantLastName}</p>
                        <Badge className={`text-[10px] border-0 ${STATUS_COLOR[p.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {statusLabel(p.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        For {p.child?.firstName} · {p.applicationNumber} · {daysSince(p.submittedAt)}d ago
                      </p>
                    </div>
                    {!p.assignedSocialWorker && p.status === "submitted" && (
                      <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5 flex-shrink-0">
                        <Clock className="h-3 w-3" /> Unassigned
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Add Child", desc: "Register a new child", icon: Plus, href: "/kids", color: "bg-[#6c63ff]/10 text-[#6c63ff]" },
              { label: "View Cases", desc: "Manage adoption requests", icon: ClipboardList, href: "/requests", color: "bg-amber-100 text-amber-600" },
              { label: "All Children", desc: "Browse all records", icon: Baby, href: "/kids", color: "bg-green-100 text-green-600" },
              { label: "Reports", desc: "Monthly family reports", icon: CheckCircle2, href: "/reports", color: "bg-blue-100 text-blue-600" },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.label} href={a.href}>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-[#6c63ff]/30 hover:bg-muted/40 transition cursor-pointer text-center group">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-[#6c63ff] transition">{a.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{a.desc}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
