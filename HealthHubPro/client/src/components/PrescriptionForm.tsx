import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InsertPrescription, insertPrescriptionSchema, Prescription } from "@shared/schema";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Clock } from "lucide-react";

interface PrescriptionFormProps {
  prescription?: Prescription | null;
  onClose?: () => void;
}

export default function PrescriptionForm({ prescription, onClose }: PrescriptionFormProps) {
  const { toast } = useToast();
  const isEditing = !!prescription;

  const form = useForm<InsertPrescription>({
    resolver: zodResolver(insertPrescriptionSchema),
    defaultValues: {
      medicineName: "",
      dosageForm: "Tablet",
      quantity: "",
      units: "1",
      reminderTime: "",
      frequency: "Once daily",
    },
  });

  // Set form values if editing
  useEffect(() => {
    if (prescription) {
      form.reset({
        medicineName: prescription.medicineName,
        dosageForm: prescription.dosageForm,
        quantity: prescription.quantity,
        units: prescription.units,
        reminderTime: prescription.reminderTime,
        frequency: prescription.frequency,
      });
    }
  }, [prescription, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertPrescription) => {
      const res = await apiRequest("POST", "/api/prescriptions", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Prescription added",
        description: "Your prescription has been added successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
      if (onClose) onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add prescription",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; prescription: InsertPrescription }) => {
      const res = await apiRequest("PATCH", `/api/prescriptions/${data.id}`, data.prescription);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Prescription updated",
        description: "Your prescription has been updated successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
      if (onClose) onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update prescription",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPrescription) => {
    if (isEditing && prescription) {
      updateMutation.mutate({ id: prescription.id, prescription: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
          <i className={`fas ${isEditing ? 'fa-edit' : 'fa-plus'} text-primary`}></i>
        </div>
        <DialogTitle className="text-center">
          {isEditing ? "Edit Prescription" : "Add New Prescription"}
        </DialogTitle>
        <DialogDescription className="text-center">
          {isEditing
            ? "Update your prescription details and reminder settings"
            : "Fill in the details to add a new prescription and set reminders"}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="medicineName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medicine Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. Azithromycin" 
                    {...field} 
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dosageForm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dosage Form</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value} 
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select dosage form" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Tablet">Tablet</SelectItem>
                    <SelectItem value="Capsule">Capsule</SelectItem>
                    <SelectItem value="Syrup">Syrup</SelectItem>
                    <SelectItem value="Injection">Injection</SelectItem>
                    <SelectItem value="Cream">Cream</SelectItem>
                    <SelectItem value="Drops">Drops</SelectItem>
                    <SelectItem value="Inhaler">Inhaler</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        placeholder="e.g. 500" 
                        {...field} 
                        disabled={isPending}
                      />
                    </FormControl>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        mg
                      </span>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="units"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Units</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        placeholder="e.g. 1" 
                        {...field} 
                        disabled={isPending}
                      />
                    </FormControl>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        tablet(s)
                      </span>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="reminderTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Reminder Time
                </FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input 
                      type="time" 
                      {...field} 
                      disabled={isPending}
                      className="pl-10"
                    />
                  </FormControl>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequency</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value} 
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Once daily">Once daily</SelectItem>
                    <SelectItem value="Twice daily">Twice daily</SelectItem>
                    <SelectItem value="Three times daily">Three times daily</SelectItem>
                    <SelectItem value="Once weekly">Once weekly</SelectItem>
                    <SelectItem value="As needed">As needed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isEditing ? "Update" : "Save"} Prescription
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
