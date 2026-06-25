import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Prescription } from "@shared/schema";

export function usePrescriptions(): { 
  prescriptions: Prescription[];
  isLoading: boolean;
  prescriptionCount: number;
  deletePrescription: (id: number) => Promise<any>;
} {
  const { user } = useAuth();

  const { data: prescriptions = [], isLoading } = useQuery<Prescription[]>({
    queryKey: ['/api/prescriptions'],
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/prescriptions/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
    },
  });

  const deletePrescription = async (id: number) => {
    return deleteMutation.mutateAsync(id);
  };

  return {
    prescriptions,
    isLoading,
    prescriptionCount: prescriptions?.length || 0,
    deletePrescription,
  };
}
