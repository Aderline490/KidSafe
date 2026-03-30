"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import api from "@/lib/api";
import {
  Loader2,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  UserPlus,
} from "lucide-react";

const staffRoles = [
  { value: "social_worker", label: "Social Worker" },
  { value: "orphanage_admin", label: "Orphanage Administrator" },
  { value: "district_commissioner", label: "District Commissioner" },
  { value: "ncda_official", label: "NCDA Official" },
  { value: "system_admin", label: "System Administrator" },
];

const roleColors: Record<string, string> = {
  social_worker: "bg-blue-100 text-blue-700",
  orphanage_admin: "bg-purple-100 text-purple-700",
  district_commissioner: "bg-orange-100 text-orange-700",
  ncda_official: "bg-green-100 text-green-700",
  system_admin: "bg-red-100 text-red-700",
};

interface Invite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  usedAt: string | null;
  isExpired: boolean;
  isUsed: boolean;
  invitedBy: string | null;
  createdAt: string;
}

export default function StaffPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [revoking, setRevoking] = useState<string | null>(null);

  // Modal state
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState(false);

  const fetchInvites = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/admin/invites");
      setInvites(res.data.invites);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load invites");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError("");
    if (!email || !role) {
      setSendError("Both email and role are required");
      return;
    }
    setSending(true);
    try {
      const res = await api.post("/admin/invites", { email, role });
      setInvites((prev) => [res.data.invite, ...prev]);
      setSendSuccess(true);
      setEmail("");
      setRole("");
      setTimeout(() => {
        setSendSuccess(false);
        setOpen(false);
      }, 1500);
    } catch (err: any) {
      setSendError(err.response?.data?.message || "Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      await api.delete(`/admin/invites/${id}`);
      setInvites((prev) => prev.filter((inv) => inv.id !== id));
    } catch {
      // silent
    } finally {
      setRevoking(null);
    }
  };

  const getStatus = (inv: Invite) => {
    if (inv.isUsed) return { label: "Accepted", color: "text-green-600", icon: CheckCircle };
    if (inv.isExpired) return { label: "Expired", color: "text-red-500", icon: XCircle };
    return { label: "Pending", color: "text-orange-500", icon: Clock };
  };

  const getRoleLabel = (value: string) =>
    staffRoles.find((r) => r.value === value)?.label || value;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage staff invitations and access control.
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 gap-2"
          onClick={() => {
            setSendError("");
            setSendSuccess(false);
            setOpen(true);
          }}
        >
          <UserPlus className="h-4 w-4" />
          Invite Staff
        </Button>
      </div>

      {/* Invite Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              New Staff Invitation
            </DialogTitle>
          </DialogHeader>

          {sendSuccess ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-semibold text-green-700">Invitation sent!</p>
              <p className="text-sm text-muted-foreground text-center">
                The staff member will receive an email with a registration link.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendInvite} className="space-y-4 pt-2">
              {sendError && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                  {sendError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="invite-email">Staff Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="staff@kidsafe.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Assign Role</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(String(v ?? ""))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffRoles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 leading-relaxed">
                The staff member will receive a secure link valid for{" "}
                <strong>48 hours</strong>. They only need to set their name and password — their role is pre-assigned.
              </p>

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Invite
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Invites Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Invitations</CardTitle>
            <span className="text-xs text-muted-foreground">{invites.length} total</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-sm text-destructive">{error}</div>
          ) : invites.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No invites sent yet.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setOpen(true)}
              >
                Send first invite
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {invites.map((inv) => {
                const status = getStatus(inv);
                const StatusIcon = status.icon;
                return (
                  <div key={inv.id} className="flex items-center gap-4 px-4 py-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {inv.email.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{inv.email}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[inv.role] || "bg-gray-100 text-gray-700"}`}>
                          {getRoleLabel(inv.role)}
                        </span>
                        {inv.invitedBy && (
                          <span className="text-xs text-muted-foreground">
                            by {inv.invitedBy}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`flex items-center gap-1 justify-end text-xs font-medium ${status.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {!inv.isUsed && (
                      <button
                        onClick={() => handleRevoke(inv.id)}
                        disabled={revoking === inv.id}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-2 shrink-0"
                        title="Revoke invite"
                      >
                        {revoking === inv.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
