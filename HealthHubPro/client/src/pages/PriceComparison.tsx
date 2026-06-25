import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MainLayout from "@/layouts/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { InsertPriceComparison, insertPriceComparisonSchema, PharmacyPrice } from "@shared/schema";
import { 
  Card,
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2, Search } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

export default function PriceComparison() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<PharmacyPrice[] | null>(null);
  const [medicineInfo, setMedicineInfo] = useState<{
    name: string;
    lowestPrice: number;
  } | null>(null);
  
  // Common medications for quick search
  const commonMedications = [
    { name: "Paracetamol", category: "Pain Relief" },
    { name: "Azithromycin", category: "Antibiotic" },
    { name: "Montelukast", category: "Allergy" },
    { name: "Pantoprazole", category: "Digestive" },
    { name: "Atorvastatin", category: "Cholesterol" },
    { name: "Amlodipine", category: "Blood Pressure" },
    { name: "Metformin", category: "Diabetes" },
    { name: "Dolo 650", category: "Pain Relief" },
    { name: "Crocin", category: "Pain Relief" },
    { name: "Saridon", category: "Pain Relief" },
    { name: "Allegra", category: "Allergy" },
    { name: "Cetirizine", category: "Allergy" },
    { name: "Omeprazole", category: "Digestive" },
    { name: "Levocetrizine", category: "Allergy" },
    { name: "Metoprolol", category: "Heart" },
    { name: "Losartan", category: "Blood Pressure" },
    { name: "Ramipril", category: "Blood Pressure" },
    { name: "Telmisartan", category: "Blood Pressure" },
    { name: "Rosuvastatin", category: "Cholesterol" },
    { name: "Glimepiride", category: "Diabetes" },
  ];

  const form = useForm<InsertPriceComparison>({
    resolver: zodResolver(insertPriceComparisonSchema),
    defaultValues: {
      medicineName: "",
    },
  });

  const searchMutation = useMutation({
    mutationFn: async (data: InsertPriceComparison) => {
      const res = await apiRequest("POST", "/api/price-comparison/search", data);
      return res.json();
    },
    onSuccess: (data) => {
      setSearchResults(data.prices);
      setMedicineInfo({
        name: data.medicineName,
        lowestPrice: data.lowestPrice,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/price-comparisons/recent'] });
      toast({
        title: "Search completed",
        description: `Found price information for ${data.medicineName}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Failed to search medicine prices",
        variant: "destructive",
      });
      setSearchResults(null);
      setMedicineInfo(null);
    },
  });

  const onSubmit = (data: InsertPriceComparison) => {
    searchMutation.mutate(data);
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Price Comparison</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Compare medicine prices across Indian pharmacies
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Medicine Prices</CardTitle>
              <CardDescription>
                Enter a medicine name to compare prices across multiple pharmacies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-2">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="medicineName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="e.g. Azithromycin, Montelukast, Paracetamol..."
                              {...field}
                              disabled={searchMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" disabled={searchMutation.isPending}>
                    {searchMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Search
                  </Button>
                </form>
              </Form>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Common Medications
                </h3>
                <div className="flex flex-wrap gap-2">
                  {commonMedications.map((med) => (
                    <button
                      key={med.name}
                      onClick={() => {
                        form.setValue('medicineName', med.name);
                        form.handleSubmit(onSubmit)();
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-full 
                        bg-blue-50 text-blue-700 hover:bg-blue-100 
                        dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50
                        border border-blue-200 dark:border-blue-800 transition-colors"
                      title={`${med.category}`}
                    >
                      {med.name}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {searchMutation.isPending ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : searchResults ? (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Results for {medicineInfo?.name}</CardTitle>
                <CardDescription>
                  Showing prices from various pharmacies with the lowest price highlighted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pharmacy</TableHead>
                      <TableHead>Price (₹)</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Form</TableHead>
                      <TableHead>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.length > 0 ? (
                      searchResults
                        .slice()
                        .sort((a, b) => a.price - b.price)
                        .map((result, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{result.pharmacy}</TableCell>
                            <TableCell 
                              className={
                                result.price === medicineInfo?.lowestPrice
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium"
                                  : ""
                              }
                            >
                              ₹{result.price}
                            </TableCell>
                            <TableCell>{result.discount}</TableCell>
                            <TableCell>{result.dosageForm}</TableCell>
                            <TableCell>{result.quantity}</TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No price data found for this medicine
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>About Price Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Our price comparison tool helps you find the best deals on your medications across
                major Indian pharmacies including Apollo, Netmeds, PharmEasy, and Tata 1MG.
                <br /><br />
                Simply enter the name of your medicine above, and we'll show you the current prices,
                discounts, and availability from these pharmacies. The lowest price will be highlighted
                in green.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
