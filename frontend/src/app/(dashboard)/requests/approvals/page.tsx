"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown, ChevronUp, CheckCircle2, XCircle,
  Baby, Clock, SlidersHorizontal,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface Proposal {
  id: string;
  applicationNumber: string;
  status: string;
  adoptionType: string;
  submittedAt: string;
  updatedAt: string;
  applicantFirstName: string;
  applicantLastName: string;
  applicantEmail: string;
  applicantPhone?: string;
  motivation?: string;
  livingConditions?: string;
  familyDescription?: string;
  financialInfo?: string;
  assignedSocialWorker: { id: string; firstName: string; lastName: string } | null;
  child: { id: string; firstName: string; district: string; photo: string; dateOfBirth: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  level1_approved: "bg-green-100 text-green-700",
  level2_approved: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-800",
  level1_rejected: "bg-red-100 text-red-600",
  level2_rejected: "bg-red-100 text-red-600",
  rejected: "bg-red-100 text-red-700",
};

function statusLabel(s: string) {
  const map: Record<string, string> = {
    level1_approved: "SW Approved",
    level2_approved: "DC Approved",
    level1_rejected: "SW Rejected",
    level2_rejected: "DC Rejected",
    approved: "Fully Approved",
    rejected: "Rejected",
  };
  return map[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function daysSince(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
}

// Which statuses each role reviews
const REVIEW_STATUS: Record<string, string> = {
  district_commissioner: "level1_approved",
  ncda_official: "level2_approved",
  system_admin: "level1_approved",
};

const NEXT_ACTION: Record<string, { approve: string; reject: string }> = {
  district_commissioner: { approve: "level2_approved", reject: "level2_rejected" },
  ncda_official: { approve: "approved", reject: "rejected" },
  system_admin: { approve: "level2_approved", reject: "level2_rejected" },
};

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});

  const reviewStatus = user ? REVIEW_STATUS[user.role] : null;

  const fetchProposals = () => {
    if (!reviewStatus) { setLoading(false); return; }
    setLoading(true);
    api.get(`/staff/proposals?status=${reviewStatus}`)
      .then((r) => setProposals(r.data.proposals ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProposals(); }, [reviewStatus]);

  const handleDecision = async (id: string, decision: "approve" | "reject") => {
    if (!user) return;
    const next = NEXT_ACTION[user.role];
    if (!next) return;
    setActionLoading(id + decision);
    try {
      await api.patch(`/staff/proposals/${id}/review`, {
        action: decision,
        comments: comments[id] ?? "",
      });
      fetchProposals();
      setExpanded(null);
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const roleLabel = user?.role === "district_commissioner"
    ? "District Commissioner"
    : user?.role === "ncda_official"
    ? "NCDA Official"
    : "Admin";

  const awaitingLabel = user?.role === "district_commissioner"
    ? "Awaiting District Approval"
    : user?.role === "ncda_official"
    ? "Awaiting NCDA Approval"
    : "Awaiting Level 2 Approval";

  if (!reviewStatus) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Approvals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">You do not have an approval role assigned.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Approvals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {roleLabel} · {loading ? "—" : proposals.length} proposal{proposals.length !== 1 ? "s" : ""} {awaitingLabel.toLowerCase()}
          </p>
        </div>
        {proposals.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
            <Clock className="h-4 w-4" />
            {proposals.length} pending
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : proposals.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center py-16 gap-3 text-center">
            <CheckCircle2 className="h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-500">No proposals awaiting your approval</p>
            <p className="text-sm text-muted-foreground">All caught up — check back later.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => {
            const isExpanded = expanded === p.id;
            return (
              <Card key={p.id} className="shadow-sm overflow-hidden">
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition"
                  onClick={() => setExpanded(isExpanded ? null : p.id)}
                >
                  {p.child?.photo ? (
                    <img src={p.child.photo} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Baby className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{p.applicantFirstName} {p.applicantLastName}</p>
                      <Badge className={`text-[10px] border-0 ${STATUS_COLOR[p.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {statusLabel(p.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.applicationNumber} · For {p.child?.firstName ?? "—"} ({p.child ? getAge(p.child.dateOfBirth) : "?"} yrs) · {p.child?.district}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {daysSince(p.submittedAt)}d ago · {p.assignedSocialWorker ? `SW: ${p.assignedSocialWorker.firstName}` : "Unassigned"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Needs Review
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 px-5 py-5 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Applicant</p>
                        <p className="text-sm font-semibold">{p.applicantFirstName} {p.applicantLastName}</p>
                        <p className="text-xs text-muted-foreground">{p.applicantEmail}</p>
                        {p.applicantPhone && <p className="text-xs text-muted-foreground">{p.applicantPhone}</p>}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Child</p>
                        {p.child && (
                          <>
                            <p className="text-sm font-semibold">{p.child.firstName}</p>
                            <p className="text-xs text-muted-foreground">{getAge(p.child.dateOfBirth)} yrs · {p.child.district}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {p.motivation && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Motivation</p>
                        <p className="text-sm text-foreground leading-relaxed">{p.motivation}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {p.livingConditions && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Housing</p>
                          <p className="text-sm text-foreground">{p.livingConditions}</p>
                        </div>
                      )}
                      {p.familyDescription && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Family</p>
                          <p className="text-sm text-foreground">{p.familyDescription}</p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border pt-4 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Decision</p>
                      <Textarea
                        placeholder="Add comments or reasoning (optional)..."
                        rows={3}
                        value={comments[p.id] ?? ""}
                        onChange={(e) => setComments((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      />
                      <div className="flex gap-3">
                        <Button
                          className="bg-green-600 hover:bg-green-700 gap-2"
                          onClick={() => handleDecision(p.id, "approve")}
                          disabled={!!actionLoading}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {actionLoading === p.id + "approve" ? "Approving..." : "Approve"}
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 gap-2"
                          onClick={() => handleDecision(p.id, "reject")}
                          disabled={!!actionLoading}
                        >
                          <XCircle className="h-4 w-4" />
                          {actionLoading === p.id + "reject" ? "Rejecting..." : "Reject"}
                        </Button>
                      </div>
                    </div>
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
