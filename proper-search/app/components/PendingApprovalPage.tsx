"use client";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Clock, Mail, LogOut } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

type Props = {
  userEmail: string;
};

export default function PendingApprovalPage({ userEmail }: Props) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
    window.location.reload();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/proper-search-logo.png"
            alt="ProperSearch"
            width={180}
            height={88}
            className="mx-auto"
            priority
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-orange-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pending Approval
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Your account is awaiting admin approval. You'll receive an email once your account has been activated.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>{userEmail}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleRefresh}
              className="w-full"
            >
              Check Status
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Need help? Contact support@propersearch.io
          </p>
        </div>
      </div>
    </div>
  );
}
