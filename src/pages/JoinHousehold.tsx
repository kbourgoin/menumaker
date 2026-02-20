import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth";
import { useHouseholdMutations } from "@/hooks/household";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared";
import { Users, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function JoinHousehold() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { joinHousehold, isJoining } = useHouseholdMutations();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  // If not authenticated, redirect to auth with invite code preserved
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && inviteCode) {
      navigate(`/auth?invite=${encodeURIComponent(inviteCode)}`, { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, inviteCode, navigate]);

  const handleJoin = async () => {
    if (!inviteCode) return;
    try {
      setError(null);
      await joinHousehold(inviteCode);
      toast({ title: "Joined household!", description: "You now have access to shared recipes." });
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Failed to join household. The invite link may be invalid.");
    }
  };

  if (isAuthLoading) {
    return <LoadingSpinner size="lg" text="Loading..." />;
  }

  if (!isAuthenticated) {
    return null; // useEffect will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="h-12 w-12 text-terracotta-500 mx-auto mb-2" />
          <CardTitle>Join a Household</CardTitle>
          <CardDescription>
            You've been invited to share recipes with a household.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <Button
            onClick={handleJoin}
            disabled={isJoining}
            className="w-full"
          >
            {isJoining ? "Joining..." : "Join Household"}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="w-full"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
