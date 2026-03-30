"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ChevronDown, ChevronUp, CheckCircle2, XCircle,
  CalendarCheck, Clock, Baby, Search, SlidersHorizontal,
  UserPlus, X, Mail, Home, AlertTriangle, FileText, ExternalLink, Trash2,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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

interface SocialWorker {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const STATUS_COLOR: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700",
  home_visit_scheduled: "bg-amber-100 text-amber-700",
  home_visit_completed: "bg-purple-100 text-purple-700",
  level1_approved: "bg-green-100 text-green-700",
  level1_rejected: "bg-red-100 text-red-600",
  level2_approved: "bg-teal-100 text-teal-700",
  level2_rejected: "bg-red-100 text-red-600",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
};

function statusLabel(s: string) {
  const map: Record<string, string> = {
    submitted: "Submitted",
    home_visit_scheduled: "Visit Scheduled",
    home_visit_completed: "Visit Done",
    level1_approved: "SW Approved",
    level1_rejected: "SW Rejected",
    level2_approved: "DC Approved",
    level2_rejected: "DC Rejected",
    approved: "Fully Approved",
    rejected: "Rejected",
  };
  return map[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function adoptionTypeLabel(t: string) {
  if (t === "foster_care") return "Foster Care";
  if (t === "emergent") return "Emergent";
  return "Permanent";
}

function getAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function daysSince(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
}

// Which status each role can review
const REVIEW_STATUS: Record<string, string> = {
  social_worker: "home_visit_completed",
  district_commissioner: "level1_approved",
  ncda_official: "level2_approved",
  system_admin: "level1_approved",
};

// Default filter for each role
const DEFAULT_FILTER: Record<string, string> = {
  district_commissioner: "level1_approved",
  ncda_official: "level2_approved",
};

export default function RequestsPage() {
  const { user } = useAuth();
  const role = user?.role ?? "";
  const isSW = role === "social_worker";
  const isAdmin = role === "system_admin" || role === "orphanage_admin";
  const isDC = role === "district_commissioner";
  const isNcda = role === "ncda_official";

  const reviewableStatus = REVIEW_STATUS[role] ?? null;

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [socialWorkers, setSocialWorkers] = useState<SocialWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState(DEFAULT_FILTER[role] ?? "all");
  const [filterMine, setFilterMine] = useState(isSW);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [assignSW, setAssignSW] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [visitModal, setVisitModal] = useState<{ proposalId: string; name: string } | null>(null);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");

  const [postApprovalLoading, setPostApprovalLoading] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [placedIds, setPlacedIds] = useState<Record<string, "matched" | "adopted">>({});
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    confirmClass: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Documents per proposal
  const [proposalDocs, setProposalDocs] = useState<Record<string, any[]>>({});
  const [docsLoading, setDocsLoading] = useState<string | null>(null);

  const fetchDocs = async (proposalId: string) => {
    if (proposalDocs[proposalId] !== undefined) return;
    setDocsLoading(proposalId);
    try {
      const res = await api.get(`/staff/proposals/${proposalId}/documents`);
      setProposalDocs((prev) => ({ ...prev, [proposalId]: res.data.documents ?? [] }));
    } catch {
      setProposalDocs((prev) => ({ ...prev, [proposalId]: [] }));
    } finally {
      setDocsLoading(null);
    }
  };

  const handleDeleteDoc = async (proposalId: string, docId: string) => {
    try {
      await api.delete(`/staff/proposals/${proposalId}/documents/${docId}`);
      setProposalDocs((prev) => ({
        ...prev,
        [proposalId]: (prev[proposalId] ?? []).filter((d) => d.id !== docId),
      }));
    } catch {
      alert("Failed to delete document");
    }
  };

  const handleInviteFamily = (p: Proposal) => {
    setConfirmModal({
      title: "Invite Family to Create Account",
      description: `This will send ${p.applicantFirstName} ${p.applicantLastName} (${p.applicantEmail}) an email with a link to create their KidSafe account. They'll be able to log in, track their placement, and submit monthly reports.`,
      confirmLabel: "Send Invite",
      confirmClass: "bg-[#6c63ff] hover:bg-[#5a52d5]",
      onConfirm: async () => {
        setPostApprovalLoading(p.id + "invite");
        try {
          await api.post(`/staff/proposals/${p.id}/invite-family`, {});
          setInvitedIds((prev) => new Set([...prev, p.id]));
        } catch (err: any) {
          alert(err.response?.data?.message ?? "Failed to send invite");
        } finally {
          setPostApprovalLoading(null);
        }
      },
    });
  };

  const handleMarkPlaced = (p: Proposal, placementType: "matched" | "adopted") => {
    const label = placementType === "adopted" ? "Adopted" : "Foster / Matched";
    setConfirmModal({
      title: `Mark Child as ${label}`,
      description: `This will update ${p.child?.firstName ?? "the child"}'s status to "${placementType}" and remove them from the public available listing. This action reflects a physical placement.`,
      confirmLabel: `Confirm — ${label}`,
      confirmClass: placementType === "adopted" ? "bg-green-600 hover:bg-green-700" : "bg-amber-500 hover:bg-amber-600",
      onConfirm: async () => {
        setPostApprovalLoading(p.id + "place");
        try {
          await api.patch(`/staff/proposals/${p.id}/place`, { placementType });
          setPlacedIds((prev) => ({ ...prev, [p.id]: placementType }));
          fetchProposals();
        } catch (err: any) {
          alert(err.response?.data?.message ?? "Failed to update placement");
        } finally {
          setPostApprovalLoading(null);
        }
      },
    });
  };

  const fetchProposals = () => {
    const params = new URLSearchParams();
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (filterMine) params.set("assignedToMe", "true");
    setLoading(true);
    api.get(`/staff/proposals?${params}`)
      .then((r) => setProposals(r.data.proposals ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProposals(); }, [filterStatus, filterMine]);

  useEffect(() => {
    if (isAdmin || isNcda) {
      api.get("/staff/social-workers")
        .then((r) => setSocialWorkers(r.data.socialWorkers ?? []))
        .catch(() => {});
    }
  }, [isAdmin, isNcda]);

  const handleReview = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id + action);
    try {
      await api.patch(`/staff/proposals/${id}/review`, { action, comments: comments[id] ?? "" });
      fetchProposals();
      setExpanded(null);
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const openVisitModal = (p: Proposal) => {
    setVisitModal({ proposalId: p.id, name: `${p.applicantFirstName} ${p.applicantLastName}` });
    setVisitDate("");
    setVisitTime("");
  };

  const handleScheduleVisit = async () => {
    if (!visitModal || !visitDate || !visitTime) return;
    const scheduledDate = new Date(`${visitDate}T${visitTime}:00`).toISOString();
    setActionLoading(visitModal.proposalId + "visit");
    try {
      await api.post("/staff/home-visits", { proposalId: visitModal.proposalId, scheduledDate });
      setVisitModal(null);
      fetchProposals();
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to schedule visit");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignSW = async (proposalId: string) => {
    const swId = assignSW[proposalId];
    if (!swId) return;
    setAssigningId(proposalId);
    try {
      await api.patch(`/staff/proposals/${proposalId}/assign`, { socialWorkerId: swId });
      fetchProposals();
      setAssignSW((prev) => { const n = { ...prev }; delete n[proposalId]; return n; });
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to assign social worker");
    } finally {
      setAssigningId(null);
    }
  };

  const pageTitle = isDC ? "Cases & Approvals" : isNcda ? "Cases & Final Approvals" : "Cases";
  const pageSubtitle = isSW
    ? "Adoption cases assigned to you"
    : isDC
    ? "Review and approve proposals at district level"
    : isNcda
    ? "Final approval stage — NCDA"
    : "All adoption proposals";

  const pendingCount = proposals.filter((p) => p.status === reviewableStatus).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pageSubtitle}</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 text-sm font-medium bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-1.5">
            <Clock className="h-4 w-4" />
            {pendingCount} awaiting your review
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" /> Filter:
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="home_visit_scheduled">Visit Scheduled</SelectItem>
            <SelectItem value="home_visit_completed">Visit Completed</SelectItem>
            <SelectItem value="level1_approved">SW Approved</SelectItem>
            <SelectItem value="level1_rejected">SW Rejected</SelectItem>
            {(isDC || isNcda || isAdmin) && (
              <>
                <SelectItem value="level2_approved">DC Approved</SelectItem>
                <SelectItem value="level2_rejected">DC Rejected</SelectItem>
              </>
            )}
            <SelectItem value="approved">Fully Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        {isSW && (
          <button
            onClick={() => setFilterMine((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${filterMine ? "bg-[#6c63ff] text-white border-[#6c63ff]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
          >
            {filterMine ? "My Cases" : "All Cases"}
          </button>
        )}

        {/* Quick filter buttons for DC/NCDA */}
        {(isDC || isNcda) && (
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus(isDC ? "level1_approved" : "level2_approved")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                filterStatus === (isDC ? "level1_approved" : "level2_approved")
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              Needs Review
            </button>
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                filterStatus === "all"
                  ? "bg-[#6c63ff] text-white border-[#6c63ff]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              All Cases
            </button>
          </div>
        )}

        <span className="text-xs text-muted-foreground ml-auto">
          {proposals.length} proposal{proposals.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : proposals.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center py-16 gap-3 text-center">
            <Search className="h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-500">No proposals found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => {
            const isExpanded = expanded === p.id;
            const canReview = reviewableStatus !== null && p.status === reviewableStatus;
            const canSchedule = p.status === "submitted" && isSW;
            const canAssign = p.status === "submitted" && (isAdmin || isNcda) && !p.assignedSocialWorker;
            const isAssigning = assigningId === p.id;
            const needsReview = canReview;

            return (
              <Card key={p.id} className={`shadow-sm overflow-hidden ${needsReview ? "border-amber-200" : ""}`}>
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition"
                  onClick={() => {
                    const next = isExpanded ? null : p.id;
                    setExpanded(next);
                    if (next) fetchDocs(next);
                  }}
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
                      <Badge variant="outline" className="text-[10px]">
                        {adoptionTypeLabel(p.adoptionType)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.applicationNumber} · For {p.child?.firstName ?? "—"} ({p.child ? getAge(p.child.dateOfBirth) : "?"} yrs) · {p.child?.district}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {daysSince(p.submittedAt)}d ago ·{" "}
                      {p.assignedSocialWorker
                        ? `SW: ${p.assignedSocialWorker.firstName} ${p.assignedSocialWorker.lastName}`
                        : <span className="text-amber-600 font-medium">Unassigned</span>}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canSchedule && (
                      <Button size="sm" variant="outline" className="text-xs gap-1 h-7"
                        onClick={(e) => { e.stopPropagation(); openVisitModal(p); }}
                        disabled={actionLoading === p.id + "visit"}>
                        <CalendarCheck className="h-3.5 w-3.5" /> Schedule Visit
                      </Button>
                    )}
                    {canAssign && (
                      <Button size="sm" className="text-xs gap-1 h-7 bg-[#6c63ff] hover:bg-[#5a52d5]"
                        onClick={(e) => { e.stopPropagation(); setExpanded(p.id); }}>
                        <UserPlus className="h-3.5 w-3.5" /> Assign SW
                      </Button>
                    )}
                    {needsReview && (
                      <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Needs Review
                      </span>
                    )}
                    {isExpanded
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
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
                    {p.financialInfo && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Financial</p>
                        <p className="text-sm text-foreground">{p.financialInfo}</p>
                      </div>
                    )}

                    {/* Documents */}
                    <div className="border-t border-border pt-4 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> Uploaded Documents
                      </p>
                      {docsLoading === p.id ? (
                        <p className="text-xs text-muted-foreground">Loading documents...</p>
                      ) : (proposalDocs[p.id] ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">No documents uploaded yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(proposalDocs[p.id] ?? []).map((doc: any) => (
                            <div key={doc.id} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
                              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate">{doc.docType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
                                <a
                                  href={doc.filePath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-[#6c63ff] hover:underline flex items-center gap-0.5"
                                >
                                  {doc.fileName} <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              </div>
                              {(isAdmin || isNcda) && (
                                <button
                                  onClick={() => handleDeleteDoc(p.id, doc.id)}
                                  className="text-muted-foreground hover:text-red-500 transition flex-shrink-0"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Assign SW (admin only) */}
                    {canAssign && (
                      <div className="border-t border-border pt-4 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                          <UserPlus className="h-3.5 w-3.5" /> Assign Social Worker
                        </p>
                        {socialWorkers.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No social workers found. Invite staff first.</p>
                        ) : (
                          <div className="flex items-center gap-3">
                            <select
                              value={assignSW[p.id] ?? ""}
                              onChange={(e) => setAssignSW((prev) => ({ ...prev, [p.id]: e.target.value }))}
                              className="flex-1 h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <option value="">Select a social worker...</option>
                              {socialWorkers.map((sw) => (
                                <option key={sw.id} value={sw.id}>
                                  {sw.firstName} {sw.lastName} ({sw.email})
                                </option>
                              ))}
                            </select>
                            <Button className="bg-[#6c63ff] hover:bg-[#5a52d5] gap-2 shrink-0"
                              onClick={() => handleAssignSW(p.id)}
                              disabled={isAssigning || !assignSW[p.id]}>
                              <UserPlus className="h-4 w-4" />
                              {isAssigning ? "Assigning..." : "Assign"}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Already assigned */}
                    {p.assignedSocialWorker && !canAssign && (
                      <div className="text-xs text-muted-foreground border-t border-border pt-3">
                        Assigned to{" "}
                        <span className="font-semibold text-foreground">
                          {p.assignedSocialWorker.firstName} {p.assignedSocialWorker.lastName}
                        </span>
                      </div>
                    )}

                    {/* Post-approval actions (admin only, approved proposals) */}
                    {isAdmin && p.status === "approved" && (
                      <div className="border-t border-border pt-4 space-y-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Post-Approval Actions
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Invite family */}
                          <div className={`rounded-xl border p-4 space-y-2 transition-colors ${invitedIds.has(p.id) ? "border-green-200 bg-green-50" : "border-border"}`}>
                            <div className="flex items-center gap-2">
                              <Mail className={`h-4 w-4 ${invitedIds.has(p.id) ? "text-green-600" : "text-[#6c63ff]"}`} />
                              <p className="text-sm font-semibold">Invite Family</p>
                              {invitedIds.has(p.id) && (
                                <span className="ml-auto text-xs font-semibold text-green-600 flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Sent
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {invitedIds.has(p.id)
                                ? `Invite sent to ${p.applicantEmail}. They can now create their account.`
                                : `Send ${p.applicantFirstName} an account creation link so they can log in and submit monthly reports.`}
                            </p>
                            <Button
                              size="sm"
                              className={`w-full gap-2 ${invitedIds.has(p.id) ? "bg-green-600 hover:bg-green-700" : "bg-[#6c63ff] hover:bg-[#5a52d5]"}`}
                              onClick={() => handleInviteFamily(p)}
                              disabled={postApprovalLoading === p.id + "invite"}
                            >
                              <Mail className="h-3.5 w-3.5" />
                              {postApprovalLoading === p.id + "invite"
                                ? "Sending..."
                                : invitedIds.has(p.id)
                                ? "Resend Invite"
                                : "Send Invite"}
                            </Button>
                          </div>

                          {/* Mark as placed */}
                          <div className={`rounded-xl border p-4 space-y-2 transition-colors ${placedIds[p.id] ? "border-green-200 bg-green-50" : "border-border"}`}>
                            <div className="flex items-center gap-2">
                              <Home className={`h-4 w-4 ${placedIds[p.id] ? "text-green-600" : "text-green-600"}`} />
                              <p className="text-sm font-semibold">Placement Status</p>
                              {placedIds[p.id] && (
                                <span className="ml-auto text-xs font-semibold text-green-600 flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {placedIds[p.id] === "adopted" ? "Adopted" : "Foster / Matched"}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {placedIds[p.id]
                                ? `${p.child?.firstName ?? "Child"} has been marked as ${placedIds[p.id] === "adopted" ? "adopted" : "matched (foster care)"}. Their profile is no longer listed as available.`
                                : "Update the child's status once physically placed with the family."}
                            </p>
                            {placedIds[p.id] ? (
                              <div className="flex items-center gap-2 py-1">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium text-green-700">
                                  Placement recorded
                                </span>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 text-xs"
                                  onClick={() => handleMarkPlaced(p, "matched")}
                                  disabled={!!postApprovalLoading}
                                >
                                  Foster / Temp
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                                  onClick={() => handleMarkPlaced(p, "adopted")}
                                  disabled={!!postApprovalLoading}
                                >
                                  {postApprovalLoading === p.id + "place" ? "Saving..." : "Adopted"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Review decision (SW, DC, NCDA) */}
                    {canReview && (
                      <div className="border-t border-border pt-4 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          {isDC ? "District Decision" : isNcda ? "NCDA Final Decision" : "Your Decision"}
                        </p>
                        <Textarea
                          placeholder="Add comments or reasoning (optional)..."
                          rows={3}
                          value={comments[p.id] ?? ""}
                          onChange={(e) => setComments((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        />
                        <div className="flex gap-3">
                          <Button className="bg-green-600 hover:bg-green-700 gap-2"
                            onClick={() => handleReview(p.id, "approve")}
                            disabled={!!actionLoading}>
                            <CheckCircle2 className="h-4 w-4" />
                            {actionLoading === p.id + "approve" ? "Approving..." : isDC ? "Approve (Level 2)" : isNcda ? "Final Approve" : "Approve"}
                          </Button>
                          <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 gap-2"
                            onClick={() => handleReview(p.id, "reject")}
                            disabled={!!actionLoading}>
                            <XCircle className="h-4 w-4" />
                            {actionLoading === p.id + "reject" ? "Rejecting..." : "Reject"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Generic Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmModal(null)} />
          <div className="relative z-10 bg-background rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">{confirmModal.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{confirmModal.description}</p>
                </div>
              </div>
              <button onClick={() => setConfirmModal(null)} className="text-muted-foreground hover:text-foreground transition ml-2 flex-shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                className={`flex-1 gap-2 ${confirmModal.confirmClass}`}
                onClick={async () => {
                  await confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
              >
                {confirmModal.confirmLabel}
              </Button>
              <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Visit Modal */}
      {visitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setVisitModal(null)} />
          <div className="relative z-10 bg-background rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Schedule Home Visit</h2>
                <p className="text-sm text-muted-foreground mt-0.5">For {visitModal.name}</p>
              </div>
              <button onClick={() => setVisitModal(null)} className="text-muted-foreground hover:text-foreground transition -mt-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="visit-date">Date</Label>
                <input id="visit-date" type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="visit-time">Time</Label>
                <input id="visit-time" type="time"
                  value={visitTime}
                  onChange={(e) => setVisitTime(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            {visitDate && visitTime && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                <CalendarCheck className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800 font-medium">
                  {new Date(`${visitDate}T${visitTime}`).toLocaleDateString("en-GB", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })} at {visitTime}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button className="flex-1 bg-[#6c63ff] hover:bg-[#5a52d5]"
                disabled={!visitDate || !visitTime || actionLoading === visitModal.proposalId + "visit"}
                onClick={handleScheduleVisit}>
                <CalendarCheck className="h-4 w-4 mr-2" />
                {actionLoading === visitModal.proposalId + "visit" ? "Scheduling..." : "Confirm Visit"}
              </Button>
              <Button variant="outline" onClick={() => setVisitModal(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
