"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import api from "@/lib/api";
import { Loader2, Mail, Clock, CheckCircle, XCircle, Trash2 } from "lucide-react";
import Link from "next/link";

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

const roleLabels: Record<string, string> = {
  social_worker: "Social Worker",
  orphanage_admin: "Orphanage Admin",
  district_commissioner: "District Commissioner",
  ncda_official: "NCDA Official",
  system_admin: "System Admin",
};

const roleColors: Record<string, string> = {
  social_worker: "bg-blue-100 text-blue-700",
  orphanage_admin: "bg-purple-100 text-purple-700",
  district_commissioner: "bg-orange-100 text-orange-700",
  ncda_official: "bg-green-100 text-green-700",
  system_admin: "bg-red-100 text-red-700",
};

export default function ManageStaffPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchInvites = async () => {
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

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      await api.delete(`/admin/invites/${id}`);
      setInvites((prev) => prev.filter((inv) => inv.id !== id));
    } catch {
      // silently fail
    } finally {
      setRevoking(null);
    }
  };

  const getStatus = (inv: Invite) => {
    if (inv.isUsed) return { label: "Accepted", color: "text-green-600", icon: CheckCircle };
    if (inv.isExpired) return { label: "Expired", color: "text-red-500", icon: XCircle };
    return { label: "Pending", color: "text-orange-500", icon: Clock };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Staff</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View all staff invitations and their status.
          </p>
        </div>
        <Link href="/staff/invite">
          <Button className="bg-primary hover:bg-primary/90">
            <Mail className="mr-2 h-4 w-4" />
            New Invite
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Staff Invitations</CardTitle>
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
              <Link href="/staff/invite">
                <Button variant="outline" className="mt-4">Send first invite</Button>
              </Link>
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
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[inv.role] || "bg-gray-100 text-gray-700"}`}>
                          {roleLabels[inv.role] || inv.role}
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
                        className="text-muted-foreground hover:text-destructive transition-colors ml-2"
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
