"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, Mail, Phone, MapPin, Edit, Crown, 
  Save, Download, Users, Zap, Plus, MoreVertical
} from "lucide-react";

type Props = {
  userName: string;
  userEmail: string;
};

export default function AccountPage({ userName, userEmail }: Props) {
  return (
    <div className="h-full overflow-auto bg-muted/30">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Account</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Profile</h2>
              <Button variant="link" className="text-primary p-0 h-auto">
                Edit
              </Button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <User className="w-7 h-7 text-muted-foreground" />
              </div>
              <div>
                <div className="font-semibold text-lg">{userName}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Email</div>
                <div className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {userEmail}
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Phone</div>
                <div className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  (704) 649-0506
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Address</div>
                <div className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  —
                </div>
              </div>
            </div>

            <Button variant="link" className="text-primary p-0 h-auto mt-4">
              Update Email and Password
            </Button>
          </Card>

          {/* Plan Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Plan</h2>
              <div className="flex items-center gap-2">
                <Button variant="link" className="text-primary p-0 h-auto text-sm">
                  Upgrade to Annual Plan to Save 17%
                </Button>
                <Button variant="link" className="text-primary p-0 h-auto text-sm">
                  Manage Plan
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <Badge className="bg-primary text-white mb-1">Pro</Badge>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase">Type</div>
                <div className="font-medium">Monthly</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase">Saves & Exports</div>
                <div className="font-medium">50,000/mo</div>
              </div>
            </div>

            {/* Usage Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Usage</h3>
                <span className="text-xs text-muted-foreground">
                  RESETS IN 16 DAYS | 02/14/2026
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <UsageCard
                  icon={<Save className="w-5 h-5" />}
                  label="SAVES REMAINING"
                  value="21,698"
                  subtext="28,302 | 57% USED"
                  color="primary"
                />
                <UsageCard
                  icon={<Download className="w-5 h-5" />}
                  label="EXPORTS REMAINING"
                  value="46,974"
                  subtext="3,026 | 6% USED"
                  color="primary"
                />
              </div>

              <div className="mt-4 flex justify-center">
                <UsageCard
                  icon={<Users className="w-5 h-5" />}
                  label="FREE SKIP TRACES REMAINING"
                  value="36,572"
                  subtext="13,428 | 26.86% USED"
                  color="primary"
                  centered
                />
              </div>
            </div>
          </Card>

          {/* Marketing Profile Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Marketing Profile</h2>
                <p className="text-sm text-muted-foreground">Used for Marketing Campaigns</p>
              </div>
              <Button variant="link" className="text-primary p-0 h-auto">
                Add
              </Button>
            </div>

            <div className="bg-primary rounded-xl p-4 text-white">
              <h3 className="font-semibold mb-2">Complete your marketing profile!</h3>
              <p className="text-sm opacity-90 mb-4">
                Please complete your profile to experience PropSearch's add-on services, 
                such as emails, postcards, and landing pages.
              </p>
              <Button variant="secondary" size="sm">
                Start Now
              </Button>
            </div>
          </Card>

          {/* Lead Automator Card */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Lead Automator</h2>

            <div className="flex gap-8 mb-6">
              <div>
                <div className="text-xs text-muted-foreground uppercase">Plan Type</div>
                <div className="font-medium">Included with Plan</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase">Monitored Properties</div>
                <div className="font-medium">50,000</div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">MONITORED PROPERTIES REMAINING</div>
                <div className="text-2xl font-bold">50,000</div>
                <div className="text-xs text-muted-foreground">0 | 0.00% USED</div>
              </div>
            </div>
          </Card>

          {/* Team Card */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Team</h2>
              <Button variant="link" className="text-primary p-0 h-auto">
                Finish Building Your Team
              </Button>
            </div>

            <div className="flex items-center gap-8 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase">Full-Access</div>
                  <div className="text-2xl font-bold">1</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase">Scouts</div>
                <div className="text-2xl font-bold">0</div>
              </div>
              <div className="ml-auto">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add To Team
                </Button>
              </div>
            </div>

            {/* Team Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Member</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Type</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Exports</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase p-3">Spending</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{userName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm">Full Access</td>
                    <td className="p-3 text-sm">
                      <div>0</div>
                      <div className="text-xs text-muted-foreground">/Unlimited</div>
                    </td>
                    <td className="p-3 text-sm">
                      <div>$0</div>
                      <div className="text-xs text-muted-foreground">/Unlimited</div>
                    </td>
                    <td className="p-3">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function UsageCard({
  icon,
  label,
  value,
  subtext,
  color,
  centered,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: string;
  centered?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${centered ? "justify-center" : ""}`}>
      <div className={`w-12 h-12 rounded-full bg-${color}/10 flex items-center justify-center text-${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{subtext}</div>
      </div>
    </div>
  );
}
