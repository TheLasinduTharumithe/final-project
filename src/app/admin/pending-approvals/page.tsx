"use client";

// Purpose: Admin account approval page for reviewing restaurant and charity registrations.

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, FileIcon } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DashboardSkeleton, PageHeader, StatePanel } from "@/components/WorkspaceUI";
import { subscribeToPendingUsers, approveUser, rejectUser, getUserProfile } from "@/services/users";
import { subscribeToAuthState } from "@/lib/auth";
import type { AppUser } from "@/types";

export default function PendingApprovalsPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingKey, setActionLoadingKey] = useState("");

  useEffect(() => {
    let isActive = true;
    let unsubscribeUsers: (() => void) | null = null;

    const unsubscribeAuth = subscribeToAuthState(async (firebaseUser) => {
      if (!firebaseUser || !isActive) {
        return;
      }

      const userProfile = await getUserProfile(firebaseUser.uid);
      
      if (!isActive || !userProfile || userProfile.role !== "admin") {
        return;
      }

      if (!unsubscribeUsers) {
        unsubscribeUsers = subscribeToPendingUsers((pendingUsers) => {
          if (isActive) {
            setUsers(pendingUsers);
            setLoading(false);
          }
        });
      }
    });

    return () => {
      isActive = false;
      unsubscribeAuth();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      setActionLoadingKey(`approve-${userId}`);
      setError("");
      await approveUser(userId);
      setUsers((current) => current.filter((u) => u.id !== userId));
    } catch (err) {
      setError("Failed to approve user.");
    } finally {
      setActionLoadingKey("");
    }
  };

  const handleReject = async (userId: string) => {
    const confirmed = window.confirm("Are you sure you want to reject this user?");
    if (!confirmed) return;

    try {
      setActionLoadingKey(`reject-${userId}`);
      setError("");
      await rejectUser(userId);
      setUsers((current) => current.filter((u) => u.id !== userId));
    } catch (err) {
      setError("Failed to reject user.");
    } finally {
      setActionLoadingKey("");
    }
  };

  const openDocument = (base64Data: string) => {
    if (!base64Data) {
      alert("No document uploaded by this user.");
      return;
    }
    
    // For PDFs, we can try to open in a new tab if it's base64 pdf or image
    // Sometimes very large base64 URLs fail in new tab, but this is a simple approach
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`<iframe src="${base64Data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    } else {
      alert("Popup blocked. Cannot view document.");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <section className="page-shell">
        <PageHeader
          eyebrow="Pending approvals"
          title="Review new registrations"
          description="Verify uploaded licenses and certificates before granting platform access."
        />

        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <StatePanel title="Approval action failed" message={error} tone="error" />
        ) : users.length === 0 ? (
          <StatePanel title="No pending approvals" message="All new registrations have been processed." />
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="card flex flex-col justify-between gap-5 md:flex-row md:items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-[#1F2937]">{user.name}</h3>
                    <span className="status-badge">{user.role}</span>
                  </div>
                  <p className="mt-1 text-sm text-[#6B7280]">{user.email} - {user.phone}</p>
                  <p className="mt-1 text-sm text-[#6B7280]">{user.address}</p>
                  
                  {user.licenseFileName && (
                    <button 
                      onClick={() => openDocument(user.licenseFile || "")}
                      className="btn-secondary mt-3"
                    >
                      <FileIcon className="h-4 w-4" />
                      View {user.licenseFileName}
                    </button>
                  )}
                  {!user.licenseFile && (
                    <p className="mt-3 text-sm text-[#DC2626]">No document uploaded.</p>
                  )}
                </div>
                
                <div className="flex items-center gap-3 md:flex-col lg:flex-row">
                  <button
                    type="button"
                    onClick={() => handleApprove(user.id)}
                    disabled={actionLoadingKey !== ""}
                    className="btn-primary flex-1"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(user.id)}
                    disabled={actionLoadingKey !== ""}
                    className="danger-button flex-1"
                  >
                    <XCircle className="h-5 w-5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </ProtectedRoute>
  );
}
