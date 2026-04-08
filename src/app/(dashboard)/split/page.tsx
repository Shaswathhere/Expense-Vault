"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Circle,
  X,
  DollarSign,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { UserSearch } from "@/components/split/user-search";
import { useUserCurrency } from "@/hooks/use-user-currency";

interface SearchUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface SplitMember {
  id: string;
  share: number;
  isPaid: boolean;
  userId: string;
  splitGroupId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface SplitGroup {
  id: string;
  name: string;
  totalAmount: number;
  creatorId: string;
  createdAt: string;
  members: SplitMember[];
  transactions: {
    id: string;
    title: string;
    amount: number;
    date: string;
  }[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function SplitPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const { symbol } = useUserCurrency();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [memberInputs, setMemberInputs] = useState<
    { email: string; amount: string; user: SearchUser | null }[]
  >([{ email: "", amount: "", user: null }]);

  const { data: groups = [], isLoading } = useQuery<SplitGroup[]>({
    queryKey: ["split-groups"],
    queryFn: async () => {
      const res = await fetch("/api/split");
      if (!res.ok) throw new Error("Failed to fetch groups");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const total = Number(totalAmount);
      const validMembers = memberInputs.filter((m) => m.email.trim());

      if (validMembers.length === 0) {
        throw new Error("Add at least one member");
      }

      let members;
      if (splitMode === "equal") {
        // +1 because the creator (you) is auto-included by the API
        const totalPeople = validMembers.length + 1;
        const share = Math.round((total / totalPeople) * 100) / 100;
        members = validMembers.map((m) => ({
          email: m.email.trim(),
          share,
        }));
      } else {
        members = validMembers.map((m) => ({
          email: m.email.trim(),
          share: Number(m.amount),
        }));

        // In custom mode, the members' shares don't need to equal total
        // because the creator's share = total - sum of others (handled by API)
      }

      const res = await fetch("/api/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName,
          totalAmount: total,
          members,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create group");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["split-groups"] });
      toast.success("Split group created", {
        description: `"${groupName}" for ${symbol}${Number(totalAmount).toFixed(2)} — members have been notified.`,
      });
      resetForm();
    },
    onError: (e: Error) =>
      toast.error("Failed to create split", { description: e.message }),
  });

  const togglePaidMutation = useMutation({
    mutationFn: async ({
      groupId,
      memberId,
      isPaid,
    }: {
      groupId: string;
      memberId: string;
      isPaid: boolean;
    }) => {
      const res = await fetch(`/api/split/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, isPaid }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["split-groups"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/split/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["split-groups"] });
      toast.success("Split group deleted", {
        description: "The group and all records have been removed.",
      });
    },
    onError: (e: Error) =>
      toast.error("Failed to delete group", { description: e.message }),
  });

  function resetForm() {
    setShowCreateDialog(false);
    setGroupName("");
    setTotalAmount("");
    setSplitMode("equal");
    setMemberInputs([{ email: "", amount: "", user: null }]);
  }

  function addMemberInput() {
    setMemberInputs((prev) => [...prev, { email: "", amount: "", user: null }]);
  }

  function removeMemberInput(index: number) {
    setMemberInputs((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMemberInput(
    index: number,
    field: "email" | "amount",
    value: string
  ) {
    setMemberInputs((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  }

  // Calculate settlement summary across all groups
  const settlements = groups.flatMap((g) =>
    g.members
      .filter((m) => !m.isPaid)
      .map((m) => ({
        groupName: g.name,
        userName: m.user.name,
        userEmail: m.user.email,
        amount: m.share,
      }))
  );

  const totalOwed = settlements.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Split Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Split bills with friends and track who owes what
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Split
        </Button>
      </div>

      {/* Settlement Summary */}
      {groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Settlement Tracker
            </CardTitle>
            <CardDescription>
              Outstanding balances across all groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            {settlements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All settled up! No outstanding balances.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm font-medium">Total Outstanding</span>
                  <span className="text-lg font-bold text-destructive">
                    {symbol}{totalOwed.toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="space-y-2">
                  {settlements.map((s, i) => (
                    <div
                      key={`${s.userEmail}-${s.groupName}-${i}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback>
                            {getInitials(s.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium">{s.userName}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            owes for{" "}
                          </span>
                          <span className="font-medium">{s.groupName}</span>
                        </div>
                      </div>
                      <span className="font-medium text-destructive">
                        {symbol}{s.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Groups List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">No split groups yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a group to start splitting expenses with friends.
            </p>
            <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Your First Split
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => {
            const paidCount = group.members.filter((m) => m.isPaid).length;
            const allPaid = paidCount === group.members.length;

            return (
              <Card key={group.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {group.name}
                        {allPaid ? (
                          <Badge variant="secondary">Settled</Badge>
                        ) : (
                          <Badge variant="outline">
                            {paidCount}/{group.members.length} paid
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {symbol}{group.totalAmount.toFixed(2)} total{" "}
                        <span className="mx-1">-</span>
                        {format(new Date(group.createdAt), "MMM d, yyyy")}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(group.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar size="sm">
                            <AvatarFallback>
                              {getInitials(member.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {member.user.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-sm font-medium ${
                              member.isPaid
                                ? "text-muted-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {symbol}{member.share.toFixed(2)}
                          </span>
                          {currentUserId === group.creatorId ? (
                            <button
                              type="button"
                              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-muted"
                              onClick={() =>
                                togglePaidMutation.mutate({
                                  groupId: group.id,
                                  memberId: member.id,
                                  isPaid: !member.isPaid,
                                })
                              }
                              disabled={togglePaidMutation.isPending}
                            >
                              {member.isPaid ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  <span className="text-green-600">Paid</span>
                                </>
                              ) : (
                                <>
                                  <Circle className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    Mark paid
                                  </span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className={`flex items-center gap-1 text-xs font-medium ${
                              member.isPaid ? "text-green-600" : "text-amber-600"
                            }`}>
                              {member.isPaid ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4" />
                                  Paid
                                </>
                              ) : (
                                <>
                                  <Circle className="h-4 w-4" />
                                  Pending
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Split Group</DialogTitle>
            <DialogDescription>
              Split an expense among group members
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Dinner at Mario's"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Total Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Split Method</Label>
              <Select
                value={splitMode}
                onValueChange={(v) => v && setSplitMode(v as "equal" | "custom")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">Split Equally</SelectItem>
                  <SelectItem value="custom">Custom Amounts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Members</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addMemberInput}
                >
                  <UserPlus className="mr-1 h-3 w-3" /> Add
                </Button>
              </div>

              {memberInputs.map((member, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <UserSearch
                      value={member.email}
                      selectedUser={member.user}
                      onSelect={(user) => {
                        setMemberInputs((prev) =>
                          prev.map((m, i) =>
                            i === index
                              ? { ...m, email: user.email, user }
                              : m
                          )
                        );
                      }}
                      onClear={() => {
                        setMemberInputs((prev) =>
                          prev.map((m, i) =>
                            i === index
                              ? { ...m, email: "", user: null }
                              : m
                          )
                        );
                      }}
                    />
                  </div>
                  {splitMode === "custom" && (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={member.amount}
                      onChange={(e) =>
                        updateMemberInput(index, "amount", e.target.value)
                      }
                      placeholder="0.00"
                      className="w-24"
                      required
                    />
                  )}
                  {memberInputs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => removeMemberInput(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {splitMode === "equal" && totalAmount && memberInputs.filter((m) => m.email.trim()).length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Split between {memberInputs.filter((m) => m.email.trim()).length + 1} people (including you): {symbol}
                  {(
                    Number(totalAmount) /
                    (memberInputs.filter((m) => m.email.trim()).length + 1)
                  ).toFixed(2)} each
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Split
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
