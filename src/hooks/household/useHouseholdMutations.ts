import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { classifyError, logError } from "@/utils/errorHandling";

export function useHouseholdMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["household"] });
    queryClient.invalidateQueries({ queryKey: ["householdMembers"] });
    queryClient.invalidateQueries({ queryKey: ["dishes"] });
    queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    queryClient.invalidateQueries({ queryKey: ["suggestedDishes"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
    queryClient.invalidateQueries({ queryKey: ["mealHistory"] });
  };

  const joinHouseholdMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      // @ts-expect-error - join_household RPC not in auto-generated types yet
      const { data, error } = await supabase.rpc("join_household", {
        code: inviteCode,
      });
      if (error) {
        logError(classifyError(error), "useHouseholdMutations:join");
        throw error;
      }
      return data as string;
    },
    onSuccess: invalidateAll,
  });

  const leaveHouseholdMutation = useMutation({
    mutationFn: async () => {
      // @ts-expect-error - leave_household RPC not in auto-generated types yet
      const { data, error } = await supabase.rpc("leave_household");
      if (error) {
        logError(classifyError(error), "useHouseholdMutations:leave");
        throw error;
      }
      return data as string;
    },
    onSuccess: invalidateAll,
  });

  const updateHouseholdMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      // @ts-expect-error - households table not in auto-generated types yet
      const { error } = await supabase
        .from("households")
        .update({ name })
        .eq("id", id);
      if (error) {
        logError(classifyError(error), "useHouseholdMutations:update");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household"] });
    },
  });

  const regenerateInviteCodeMutation = useMutation({
    mutationFn: async () => {
      // @ts-expect-error - regenerate_invite_code RPC not in auto-generated types yet
      const { data, error } = await supabase.rpc("regenerate_invite_code");
      if (error) {
        logError(
          classifyError(error),
          "useHouseholdMutations:regenerateCode"
        );
        throw error;
      }
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household"] });
    },
  });

  return {
    joinHousehold: (code: string) => joinHouseholdMutation.mutateAsync(code),
    leaveHousehold: () => leaveHouseholdMutation.mutateAsync(),
    updateHousehold: (id: string, name: string) =>
      updateHouseholdMutation.mutateAsync({ id, name }),
    regenerateInviteCode: () =>
      regenerateInviteCodeMutation.mutateAsync(),

    isJoining: joinHouseholdMutation.isPending,
    isLeaving: leaveHouseholdMutation.isPending,
    isUpdating: updateHouseholdMutation.isPending,
    isRegenerating: regenerateInviteCodeMutation.isPending,

    joinError: joinHouseholdMutation.error
      ? classifyError(joinHouseholdMutation.error)
      : null,
    leaveError: leaveHouseholdMutation.error
      ? classifyError(leaveHouseholdMutation.error)
      : null,
  };
}
