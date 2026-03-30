"use client";

import { useAuth } from "@/contexts/AuthContext";
import ParentOverview from "./ParentOverview";
import SocialWorkerOverview from "./SocialWorkerOverview";
import DistrictCommissionerOverview from "./DistrictCommissionerOverview";
import NcdaOverview from "./NcdaOverview";
import StaffOverview from "./StaffOverview";
import OrphanageAdminOverview from "./OrphanageAdminOverview";

export default function OverviewPage() {
  const { user } = useAuth();
  if (user?.role === "adoptive_family") return <ParentOverview />;
  if (user?.role === "social_worker") return <SocialWorkerOverview />;
  if (user?.role === "district_commissioner") return <DistrictCommissionerOverview />;
  if (user?.role === "ncda_official") return <NcdaOverview />;
  if (user?.role === "orphanage_admin") return <OrphanageAdminOverview />;
  return <StaffOverview />;
}
