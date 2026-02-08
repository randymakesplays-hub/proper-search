"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Calendar,
  Crown,
  Trash2,
  Edit,
  Check,
  X,
  RefreshCw,
  Search,
  Copy,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  plan: "free" | "pro" | "enterprise";
  plan_expires_at: string | null;
  is_admin: boolean;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  last_sign_in_at?: string;
};

type Props = {
  currentUserEmail: string;
};

export default function AdminPage({ currentUserEmail }: Props) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePlan, setInvitePlan] = useState<"free" | "pro" | "enterprise">("free");
  const [isInviting, setIsInviting] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState<"free" | "pro" | "enterprise">("free");
  const [activeTab, setActiveTab] = useState<"users" | "pending">("users");

  // Count pending users
  const pendingUsers = users.filter(u => u.status === "pending");
  const approvedUsers = users.filter(u => u.status === "approved" || !u.status);

  // Check if current user is admin and load users
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // Check if current user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setIsAdmin(true);

      // Load all users with their profiles
      const { data: profiles, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUsers(profiles || []);
    } catch (err) {
      console.error("Error loading users:", err);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsInviting(true);
    try {
      // Use Supabase Admin API to invite user
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, {
        data: { plan: invitePlan },
        redirectTo: `${window.location.origin}`,
      });

      if (error) {
        // If admin API not available, show manual invite option
        if (error.message.includes("admin")) {
          toast.error("Admin API requires service role key. Use Supabase Dashboard to invite users.");
          return;
        }
        throw error;
      }

      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");
      setShowInviteForm(false);
      loadUsers();
    } catch (err: any) {
      console.error("Error inviting user:", err);
      toast.error(err.message || "Failed to invite user");
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdatePlan = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ 
          plan: editPlan,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Plan updated");
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      console.error("Error updating plan:", err);
      toast.error("Failed to update plan");
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ 
          is_admin: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success(currentStatus ? "Admin access removed" : "Admin access granted");
      loadUsers();
    } catch (err) {
      console.error("Error toggling admin:", err);
      toast.error("Failed to update admin status");
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}`;
    navigator.clipboard.writeText(link);
    toast.success("Sign-up link copied to clipboard");
  };

  const handleApproveUser = async (userId: string, email: string) => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ 
          status: "approved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success(`${email} has been approved`);
      loadUsers();
    } catch (err) {
      console.error("Error approving user:", err);
      toast.error("Failed to approve user");
    }
  };

  const handleRejectUser = async (userId: string, email: string) => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ 
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success(`${email} has been rejected`);
      loadUsers();
    } catch (err) {
      console.error("Error rejecting user:", err);
      toast.error("Failed to reject user");
    }
  };

  // Filter users based on search and current tab
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "pending") {
      return matchesSearch && user.status === "pending";
    } else {
      return matchesSearch && (user.status === "approved" || !user.status);
    }
  });

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return <Badge className="bg-purple-500">Enterprise</Badge>;
      case "pro":
        return <Badge className="bg-primary">Pro</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-muted/30 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" />
              User Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {users.length} total users
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={loadUsers}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={copyInviteLink}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Sign-up Link
            </Button>
            <Button onClick={() => setShowInviteForm(!showInviteForm)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </div>
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
            <h3 className="font-medium mb-3">Invite New User</h3>
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <select
                value={invitePlan}
                onChange={(e) => setInvitePlan(e.target.value as any)}
                className="px-3 py-2 border rounded-md bg-white"
              >
                <option value="free">Free Plan</option>
                <option value="pro">Pro Plan</option>
                <option value="enterprise">Enterprise Plan</option>
              </select>
              <Button onClick={handleInviteUser} disabled={isInviting}>
                {isInviting ? "Sending..." : "Send Invite"}
              </Button>
              <Button variant="ghost" onClick={() => setShowInviteForm(false)}>
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Note: Invites require Supabase service role key. Alternatively, share the sign-up link.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "users"
                ? "bg-primary text-white"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            Approved Users
            <Badge variant="secondary" className="ml-1 bg-white/20">
              {approvedUsers.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === "pending"
                ? "bg-orange-500 text-white"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending Approval
            {pendingUsers.length > 0 && (
              <Badge className="ml-1 bg-orange-600 text-white">
                {pendingUsers.length}
              </Badge>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg border shadow-sm">
          {activeTab === "pending" ? (
            // Pending Users Table
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-orange-50">
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Requested</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-orange-50/50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium">{user.full_name || "—"}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveUser(user.id, user.email)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectUser(user.id, user.email)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No pending requests</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">New sign-ups will appear here for approval</p>
                </div>
              )}
            </>
          ) : (
            // Approved Users Table
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Plan</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Role</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Joined</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{user.full_name || "—"}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {editingUser === user.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={editPlan}
                              onChange={(e) => setEditPlan(e.target.value as any)}
                              className="px-2 py-1 border rounded text-sm"
                            >
                              <option value="free">Free</option>
                              <option value="pro">Pro</option>
                              <option value="enterprise">Enterprise</option>
                            </select>
                            <button
                              onClick={() => handleUpdatePlan(user.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {getPlanBadge(user.plan)}
                            <button
                              onClick={() => {
                                setEditingUser(user.id);
                                setEditPlan(user.plan);
                              }}
                              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded opacity-0 group-hover:opacity-100"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.is_admin ? (
                          <Badge variant="outline" className="border-amber-500 text-amber-600">
                            <Crown className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Member</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingUser(user.id);
                              setEditPlan(user.plan);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {user.email !== currentUserEmail && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                              title={user.is_admin ? "Remove admin" : "Make admin"}
                            >
                              <Shield className={`w-4 h-4 ${user.is_admin ? "text-amber-500" : ""}`} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No users found
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="bg-white border-t px-6 py-3">
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Free:</span>{" "}
            <span className="font-medium">{approvedUsers.filter((u) => u.plan === "free").length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Pro:</span>{" "}
            <span className="font-medium">{approvedUsers.filter((u) => u.plan === "pro").length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Enterprise:</span>{" "}
            <span className="font-medium">{approvedUsers.filter((u) => u.plan === "enterprise").length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Admins:</span>{" "}
            <span className="font-medium">{users.filter((u) => u.is_admin).length}</span>
          </div>
          {pendingUsers.length > 0 && (
            <div className="ml-auto">
              <span className="text-orange-600 font-medium">{pendingUsers.length} pending approval</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
