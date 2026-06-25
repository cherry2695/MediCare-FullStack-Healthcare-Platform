import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Prescription } from "@shared/schema";
import { Edit, Trash2 } from "lucide-react";

interface PrescriptionCardProps {
  prescription: Prescription;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PrescriptionCard({ prescription, onEdit, onDelete }: PrescriptionCardProps) {
  const { medicineName, dosageForm, quantity, units, reminderTime, frequency } = prescription;

  // Determine the icon based on dosage form
  const getIcon = () => {
    switch (dosageForm.toLowerCase()) {
      case 'tablet':
        return 'fas fa-pills';
      case 'capsule':
        return 'fas fa-capsules';
      case 'syrup':
        return 'fas fa-prescription-bottle';
      case 'injection':
        return 'fas fa-syringe';
      case 'drops':
        return 'fas fa-eye-dropper';
      case 'inhaler':
        return 'fas fa-lungs';
      default:
        return 'fas fa-prescription-bottle-alt';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 mr-3">
              <i className={`${getIcon()} text-primary`}></i>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{medicineName}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{dosageForm}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Dosage</p>
              <p className="text-sm text-gray-900 dark:text-white">{quantity} - {units}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Frequency</p>
              <p className="text-sm text-gray-900 dark:text-white">{frequency}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Reminder Time</p>
            <div className="flex items-center mt-1">
              <i className="fas fa-clock text-gray-400 mr-2"></i>
              <p className="text-sm text-gray-900 dark:text-white">{reminderTime}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
