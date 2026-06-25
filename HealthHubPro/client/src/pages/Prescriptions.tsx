import { useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { usePrescriptions } from "@/hooks/usePrescriptions";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import PrescriptionForm from "@/components/PrescriptionForm";
import PrescriptionCard from "@/components/PrescriptionCard";
import { Prescription } from "@shared/schema";

export default function Prescriptions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { prescriptions, isLoading, deletePrescription } = usePrescriptions();
  const [editPrescription, setEditPrescription] = useState<Prescription | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<number | null>(null);

  const handleEdit = (prescription: Prescription) => {
    setEditPrescription(prescription);
    setShowDialog(true);
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      await deletePrescription(id);
      toast({
        title: "Prescription deleted",
        description: "Your prescription has been removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete prescription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setPrescriptionToDelete(null);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Prescriptions</h1>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  Add Prescription
                </Button>
              </DialogTrigger>
              <PrescriptionForm 
                prescription={editPrescription} 
                onClose={() => {
                  setShowDialog(false);
                  setEditPrescription(null);
                }}
              />
            </Dialog>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your prescriptions and set reminders</p>
        </div>
        
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : prescriptions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {prescriptions.map((prescription) => (
                <PrescriptionCard
                  key={prescription.id}
                  prescription={prescription}
                  onEdit={() => handleEdit(prescription)}
                  onDelete={() => setPrescriptionToDelete(prescription.id)}
                />
              ))}
            </div>
          ) : (
            <Card className="mt-4">
              <CardContent className="py-10 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                  <i className="fas fa-prescription-bottle-alt text-primary text-xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No prescriptions found</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  You haven't added any prescriptions yet. Add your first prescription to get started.
                </p>
                <Button className="mt-4" onClick={() => setShowDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Prescription
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={prescriptionToDelete !== null} onOpenChange={(open) => !open && setPrescriptionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this prescription and remove all associated reminders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              disabled={isDeleting} 
              onClick={(e) => {
                e.preventDefault();
                if (prescriptionToDelete) {
                  handleDelete(prescriptionToDelete);
                }
              }}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
