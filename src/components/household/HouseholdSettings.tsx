import { useState } from "react";
import { useHouseholdQueries } from "@/hooks/household/useHouseholdQueries";
import { useHouseholdMutations } from "@/hooks/household/useHouseholdMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, Copy, RefreshCw, LogOut, Check, Pencil } from "lucide-react";
import { LoadingSpinner } from "@/components/shared";

export function HouseholdSettings() {
  const { household, members, isLoading } = useHouseholdQueries();
  const {
    updateHousehold,
    regenerateInviteCode,
    leaveHousehold,
    isUpdating,
    isRegenerating,
    isLeaving,
  } = useHouseholdMutations();
  const { session } = useAuth();
  const { toast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [copied, setCopied] = useState(false);

  if (isLoading || !household) {
    return <LoadingSpinner size="md" text="Loading household..." />;
  }

  const inviteUrl = `${window.location.origin}/join/${household.inviteCode}`;
  const isSoloHousehold = members.length <= 1;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Invite link copied!" });
  };

  const handleUpdateName = async () => {
    if (!nameInput.trim()) return;
    await updateHousehold(household.id, nameInput.trim());
    setIsEditingName(false);
    toast({ title: "Household name updated" });
  };

  const handleRegenerateCode = async () => {
    await regenerateInviteCode();
    toast({
      title: "Invite link regenerated",
      description: "The old link no longer works.",
    });
  };

  const handleLeave = async () => {
    await leaveHousehold();
    toast({
      title: "Left household",
      description: "You now have a new personal household.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Household name */}
      <div>
        <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
          <Users className="h-5 w-5 text-terracotta-500" />
          Household
        </h3>
        {isEditingName ? (
          <div className="flex gap-2">
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Household name"
              onKeyDown={(e) => e.key === "Enter" && handleUpdateName()}
            />
            <Button onClick={handleUpdateName} disabled={isUpdating} size="sm">
              Save
            </Button>
            <Button
              onClick={() => setIsEditingName(false)}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-lg">{household.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setNameInput(household.name);
                setIsEditingName(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Members */}
      <div>
        <h4 className="font-medium mb-2">Members ({members.length})</h4>
        <ul className="space-y-2">
          {members.map((member) => (
            <li key={member.id} className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                {(member.username || member.id.slice(0, 2))
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <span>{member.username || "Unnamed"}</span>
              {member.id === session?.user?.id && (
                <span className="text-xs text-muted-foreground">(you)</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <Separator />

      {/* Invite link */}
      <div>
        <h4 className="font-medium mb-2">Invite Link</h4>
        <p className="text-sm text-muted-foreground mb-2">
          Share this link to invite someone to your household.
        </p>
        <div className="flex gap-2">
          <Input value={inviteUrl} readOnly className="font-mono text-xs" />
          <Button onClick={handleCopyLink} variant="outline" size="icon">
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            onClick={handleRegenerateCode}
            variant="outline"
            size="icon"
            disabled={isRegenerating}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Leave household */}
      {!isSoloHousehold && (
        <div>
          <h4 className="font-medium mb-2">Leave Household</h4>
          <p className="text-sm text-muted-foreground mb-2">
            You'll get a new personal household. Your contributed recipes stay
            here.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isLeaving}>
                <LogOut className="h-4 w-4 mr-2" />
                Leave Household
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave household?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your recipes will stay with the household. You'll start fresh
                  with a new personal collection.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLeave}>
                  Leave
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
