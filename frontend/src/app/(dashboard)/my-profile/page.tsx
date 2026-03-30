"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserCircle,
  Phone,
  Mail,
  CreditCard,
  Pencil,
  X,
} from "lucide-react";
import api from "@/lib/api";

export default function MyProfilePage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    address: (user as any)?.address ?? "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.put("/auth/update-profile", form);
      updateUser({ ...user!, ...res.data.user });
      setSuccess("Profile updated successfully.");
      setEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phone: user?.phone ?? "",
      address: (user as any)?.address ?? "",
    });
    setEditing(false);
    setError("");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your personal information.
        </p>
      </div>

      {/* Avatar + name */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-[#6c63ff]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-[#6c63ff]">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <span className="mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Adoptive Family</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal info */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-bold">Personal Information</CardTitle>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} className="gap-1.5">
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#6c63ff] hover:bg-[#5a52d5]"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</div>
          )}
          {success && (
            <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">{success}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/40 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {user?.email}
              <span className="ml-auto text-xs">(cannot change)</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                name="phone"
                className="pl-9"
                placeholder="+250 7XX XXX XXX"
                value={form.phone}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Home Address</Label>
            <Input
              id="address"
              name="address"
              placeholder="e.g. KG 5 Ave, Kigali"
              value={form.address}
              onChange={handleChange}
              disabled={!editing}
            />
          </div>

          {/* National ID display (read-only) */}
          {(user as any)?.nationalId && (
            <div className="space-y-1.5">
              <Label>National ID</Label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/40 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                {"*".repeat(12) + ((user as any).nationalId as string).slice(-4)}
                <span className="ml-auto text-xs">(cannot change)</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
