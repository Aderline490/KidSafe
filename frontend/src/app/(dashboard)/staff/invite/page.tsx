"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { Loader2, CheckCircle, UserPlus, Mail } from "lucide-react";

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

interface SentInvite {
  email: string;
  role: string;
  expiresAt: string;
}

export default function InviteStaffPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentInvites, setSentInvites] = useState<SentInvite[]>([]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !role) {
      setError("Both email and role are required");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/admin/invites", { email, role });
      setSentInvites((prev) => [res.data.invite, ...prev]);
      setEmail("");
      setRole("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send invite");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (value: string) =>
    staffRoles.find((r) => r.value === value)?.label || value;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Invite Staff</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send an invitation email to a staff member. They will receive a link to create their account with the assigned role.
        </p>
      </div>

      {/* Invite Form */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            New Invitation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Staff Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
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
              <Label htmlFor="role">Assign Role</Label>
              <Select onValueChange={(v) => setRole(String(v ?? ""))}>
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

            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              <strong>How it works:</strong> The staff member will receive an email with a secure link (valid for 48 hours). Clicking it will take them to a registration page where their role is pre-assigned — they only need to set their name and password.
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending invite...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sent Invites (this session) */}
      {sentInvites.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Invites Sent This Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-0">
            {sentInvites.map((inv, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires {new Date(inv.expiresAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${roleColors[inv.role] || "bg-gray-100 text-gray-700"}`}>
                  {getRoleLabel(inv.role)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
