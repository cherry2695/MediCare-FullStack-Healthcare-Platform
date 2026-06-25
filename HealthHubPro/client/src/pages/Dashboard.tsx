import { useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { usePrescriptions } from "@/hooks/usePrescriptions";
import { useReminders } from "@/hooks/useReminders";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Bell } from "lucide-react";
import PrescriptionForm from "@/components/PrescriptionForm";
import ReminderAlert from "@/components/ReminderAlert";
import MedicationReminder from "@/components/MedicationReminder";
import { Prescription, PharmacyPrice } from "@shared/schema";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

export default function Dashboard() {
  const { user } = useAuth();
  const { activeReminders, nextReminder, testReminder, dismissReminder } = useReminders();
  const { prescriptionCount } = usePrescriptions();
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  
  const { data: prescriptions } = useQuery({
    queryKey: ['/api/prescriptions'],
    enabled: !!user,
  });
  
  const { data: recentComparisons, isLoading: loadingComparisons } = useQuery({
    queryKey: ['/api/price-comparisons/recent'],
    enabled: !!user,
  });

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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back, {user.username}</p>
        </div>
        
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
          <div className="py-2">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3 dark:bg-blue-900">
                      <i className="fas fa-pills text-primary text-xl"></i>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">Active Prescriptions</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900 dark:text-white">{prescriptionCount}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-md p-3 dark:bg-green-900">
                      <i className="fas fa-clock text-green-600 text-xl dark:text-green-400"></i>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">Upcoming Reminder</dt>
                        <dd>
                          {nextReminder ? (
                            <>
                              <div className="text-lg font-medium text-gray-900 dark:text-white">{nextReminder.reminderTime}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{nextReminder.medicineName}</div>
                            </>
                          ) : (
                            <div className="text-lg font-medium text-gray-900 dark:text-white">No reminders</div>
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-amber-100 rounded-md p-3 dark:bg-amber-900">
                      <i className="fas fa-rupee-sign text-amber-500 text-xl dark:text-amber-400"></i>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">Last Price Check</dt>
                        <dd>
                          {recentComparisons && Array.isArray(recentComparisons) && recentComparisons.length > 0 ? (
                            <>
                              <div className="text-lg font-medium text-gray-900 dark:text-white">
                                ₹{recentComparisons[0]?.lowestPrice || 0}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {recentComparisons[0]?.medicineName || ""}
                              </div>
                            </>
                          ) : (
                            <div className="text-lg font-medium text-gray-900 dark:text-white">No checks</div>
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mt-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Quick Actions</h2>
              <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-auto p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary transition-colors rounded-lg shadow-sm flex flex-col items-center justify-center w-full">
                      <div className="p-3 rounded-full bg-blue-50 text-primary dark:bg-blue-900">
                        <i className="fas fa-plus-circle text-2xl"></i>
                      </div>
                      <h3 className="mt-5 text-lg font-medium text-gray-900 dark:text-white">Add Prescription</h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Save a new medication to your list</p>
                    </Button>
                  </DialogTrigger>
                  <PrescriptionForm />
                </Dialog>

                <Link href="/price-comparison">
                  <Button variant="outline" className="h-auto p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary transition-colors rounded-lg shadow-sm flex flex-col items-center justify-center w-full">
                    <div className="p-3 rounded-full bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-400">
                      <i className="fas fa-search-dollar text-2xl"></i>
                    </div>
                    <h3 className="mt-5 text-lg font-medium text-gray-900 dark:text-white">Compare Prices</h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Find the best deals across pharmacies</p>
                  </Button>
                </Link>

                <Link href="/prescriptions">
                  <Button variant="outline" className="h-auto p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary transition-colors rounded-lg shadow-sm flex flex-col items-center justify-center w-full">
                    <div className="p-3 rounded-full bg-amber-50 text-amber-500 dark:bg-amber-900 dark:text-amber-400">
                      <i className="fas fa-bell text-2xl"></i>
                    </div>
                    <h3 className="mt-5 text-lg font-medium text-gray-900 dark:text-white">Manage Reminders</h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Schedule voice alerts for medications</p>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Upcoming Reminders */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Upcoming Reminders</h2>
                <Link href="/prescriptions">
                  <a className="text-sm font-medium text-primary hover:text-primary-700">View all</a>
                </Link>
              </div>
              <div className="mt-2 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                  {activeReminders.length > 0 ? (
                    activeReminders.slice(0, 3).map((reminder) => (
                      <li key={reminder.id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2 mr-4">
                                <i className="fas fa-pills text-primary"></i>
                              </div>
                              <p className="text-sm font-medium text-primary truncate">{reminder.medicineName}</p>
                            </div>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400">
                                Today
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <i className="fas fa-prescription-bottle-alt flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500"></i>
                                {reminder.quantity} - {reminder.units}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                              <i className="fas fa-clock flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500"></i>
                              <p>
                                {reminder.reminderTime}
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-8 sm:px-6 text-center text-gray-500 dark:text-gray-400">
                      No upcoming reminders. Add a prescription to set reminders.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Recently Compared */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Recently Compared Prices</h2>
                <Link href="/price-comparison">
                  <a className="text-sm font-medium text-primary hover:text-primary-700">Compare more</a>
                </Link>
              </div>
              <div className="mt-2 flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                      {loadingComparisons ? (
                        <div className="p-4 flex justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : recentComparisons && Array.isArray(recentComparisons) && recentComparisons.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Medicine</TableHead>
                              <TableHead>Pharmacy</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Discount</TableHead>
                              <TableHead>Form</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recentComparisons.flatMap((comparison: any) => 
                              comparison.prices && Array.isArray(comparison.prices) ? 
                              comparison.prices.map((price: PharmacyPrice, idx: number) => (
                                <TableRow key={`${comparison.id}-${idx}`}>
                                  <TableCell className="font-medium">{comparison.medicineName}</TableCell>
                                  <TableCell>{price.pharmacy}</TableCell>
                                  <TableCell className={price.price === comparison.lowestPrice ? 
                                    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium" : 
                                    "text-gray-500 dark:text-gray-400"
                                  }>
                                    ₹{price.price}
                                  </TableCell>
                                  <TableCell className="text-gray-500 dark:text-gray-400">{price.discount}</TableCell>
                                  <TableCell className="text-gray-500 dark:text-gray-400">{price.dosageForm} ({price.quantity})</TableCell>
                                </TableRow>
                              )) : []
                            )}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          No price comparisons yet. Compare medicine prices to see results here.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test reminder and voice functionality */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-primary" />
            Voice Reminder System
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Our advanced voice reminder system will alert you when it's time to take your medication, 
            even when you're not actively using the application.
          </p>
          
          {/* Active Medication Reminder with sound/voice testing system */}
          <MedicationReminder medications={Array.isArray(prescriptions) ? prescriptions : []} />
        </div>
      </div>

      {/* Render active reminder alerts */}
      {activeReminders.map(reminder => (
        <ReminderAlert 
          key={reminder.id} 
          reminder={reminder}
          show={reminder.isAlertActive}
          dismissReminder={dismissReminder}
        />
      ))}
    </MainLayout>
  );
}
