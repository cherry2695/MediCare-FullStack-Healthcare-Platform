import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { validateAuth, requireAuth } from "./middleware/auth";
import { hashPassword, verifyPassword } from "./utils/password";
import { insertUserSchema, insertPrescriptionSchema, insertPriceComparisonSchema, updateUserSchema } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import { log } from "./vite";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

// Mock pharmacy data for price comparison
const pharmacyData = {
  "Paracetamol": [
    { pharmacy: "Apollo Pharmacy", price: 25, discount: "5%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Netmeds", price: 22, discount: "10%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "PharmEasy", price: 28, discount: "2%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Tata 1MG", price: 27, discount: "No discount", dosageForm: "Tablet", quantity: "10 tabs" }
  ],
  "Azithromycin": [
    { pharmacy: "Apollo Pharmacy", price: 180, discount: "5%", dosageForm: "Tablet", quantity: "6 tabs" },
    { pharmacy: "Netmeds", price: 165, discount: "8%", dosageForm: "Tablet", quantity: "6 tabs" },
    { pharmacy: "PharmEasy", price: 175, discount: "5%", dosageForm: "Tablet", quantity: "6 tabs" },
    { pharmacy: "Tata 1MG", price: 170, discount: "7%", dosageForm: "Tablet", quantity: "6 tabs" }
  ],
  "Montelukast": [
    { pharmacy: "Apollo Pharmacy", price: 220, discount: "2%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Netmeds", price: 210, discount: "10%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "PharmEasy", price: 245, discount: "2%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Tata 1MG", price: 237, discount: "5%", dosageForm: "Tablet", quantity: "10 tabs" }
  ],
  "Pantoprazole": [
    { pharmacy: "Apollo Pharmacy", price: 135, discount: "3%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Netmeds", price: 128, discount: "7%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "PharmEasy", price: 140, discount: "No discount", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Tata 1MG", price: 132, discount: "5%", dosageForm: "Tablet", quantity: "10 tabs" }
  ],
  "Atorvastatin": [
    { pharmacy: "Apollo Pharmacy", price: 175, discount: "5%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Netmeds", price: 168, discount: "8%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "PharmEasy", price: 182, discount: "2%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Tata 1MG", price: 170, discount: "6%", dosageForm: "Tablet", quantity: "10 tabs" }
  ],
  "Amlodipine": [
    { pharmacy: "Apollo Pharmacy", price: 95, discount: "4%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Netmeds", price: 90, discount: "10%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "PharmEasy", price: 98, discount: "No discount", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Tata 1MG", price: 93, discount: "5%", dosageForm: "Tablet", quantity: "10 tabs" }
  ],
  "Metformin": [
    { pharmacy: "Apollo Pharmacy", price: 85, discount: "3%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Netmeds", price: 82, discount: "5%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "PharmEasy", price: 88, discount: "2%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Tata 1MG", price: 84, discount: "4%", dosageForm: "Tablet", quantity: "10 tabs" }
  ],
  "Dolo 650": [
    { pharmacy: "Apollo Pharmacy", price: 26, discount: "2%", dosageForm: "Tablet", quantity: "15 tabs" },
    { pharmacy: "Netmeds", price: 24, discount: "8%", dosageForm: "Tablet", quantity: "15 tabs" },
    { pharmacy: "PharmEasy", price: 27, discount: "No discount", dosageForm: "Tablet", quantity: "15 tabs" },
    { pharmacy: "Tata 1MG", price: 25, discount: "5%", dosageForm: "Tablet", quantity: "15 tabs" }
  ],
  "Crocin": [
    { pharmacy: "Apollo Pharmacy", price: 28, discount: "2%", dosageForm: "Tablet", quantity: "15 tabs" },
    { pharmacy: "Netmeds", price: 25, discount: "8%", dosageForm: "Tablet", quantity: "15 tabs" },
    { pharmacy: "PharmEasy", price: 30, discount: "No discount", dosageForm: "Tablet", quantity: "15 tabs" },
    { pharmacy: "Tata 1MG", price: 27, discount: "5%", dosageForm: "Tablet", quantity: "15 tabs" }
  ],
  "Saridon": [
    { pharmacy: "Apollo Pharmacy", price: 35, discount: "3%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Netmeds", price: 32, discount: "10%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "PharmEasy", price: 36, discount: "No discount", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Tata 1MG", price: 34, discount: "4%", dosageForm: "Tablet", quantity: "10 tabs" }
  ],
  "Allegra": [
    { pharmacy: "Apollo Pharmacy", price: 120, discount: "5%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Netmeds", price: 115, discount: "8%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "PharmEasy", price: 125, discount: "2%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Tata 1MG", price: 117, discount: "6%", dosageForm: "Tablet", quantity: "10 tabs" }
  ],
  "Cetirizine": [
    { pharmacy: "Apollo Pharmacy", price: 65, discount: "4%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Netmeds", price: 60, discount: "10%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "PharmEasy", price: 68, discount: "No discount", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Tata 1MG", price: 63, discount: "5%", dosageForm: "Tablet", quantity: "10 tabs" }
  ],
  "Omeprazole": [
    { pharmacy: "Apollo Pharmacy", price: 125, discount: "3%", dosageForm: "Capsule", quantity: "10 caps" },
    { pharmacy: "Netmeds", price: 120, discount: "7%", dosageForm: "Capsule", quantity: "10 caps" },
    { pharmacy: "PharmEasy", price: 128, discount: "No discount", dosageForm: "Capsule", quantity: "10 caps" },
    { pharmacy: "Tata 1MG", price: 122, discount: "5%", dosageForm: "Capsule", quantity: "10 caps" }
  ],
  "Levocetrizine": [
    { pharmacy: "Apollo Pharmacy", price: 75, discount: "4%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Netmeds", price: 70, discount: "8%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "PharmEasy", price: 78, discount: "2%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Tata 1MG", price: 72, discount: "6%", dosageForm: "Tablet", quantity: "10 tabs" }
  ],
  "Metoprolol": [
    { pharmacy: "Apollo Pharmacy", price: 110, discount: "3%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Netmeds", price: 105, discount: "5%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "PharmEasy", price: 112, discount: "2%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Tata 1MG", price: 108, discount: "4%", dosageForm: "Tablet", quantity: "10 tabs" }
  ],
  "Losartan": [
    { pharmacy: "Apollo Pharmacy", price: 130, discount: "5%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Netmeds", price: 125, discount: "8%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "PharmEasy", price: 135, discount: "2%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Tata 1MG", price: 128, discount: "6%", dosageForm: "Tablet", quantity: "10 tabs" }
  ],
  "Ramipril": [
    { pharmacy: "Apollo Pharmacy", price: 145, discount: "4%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Netmeds", price: 140, discount: "7%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "PharmEasy", price: 150, discount: "No discount", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Tata 1MG", price: 142, discount: "5%", dosageForm: "Tablet", quantity: "10 tabs" }
  ],
  "Telmisartan": [
    { pharmacy: "Apollo Pharmacy", price: 155, discount: "3%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Netmeds", price: 148, discount: "8%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "PharmEasy", price: 160, discount: "2%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Tata 1MG", price: 152, discount: "6%", dosageForm: "Tablet", quantity: "10 tabs" }
  ],
  "Rosuvastatin": [
    { pharmacy: "Apollo Pharmacy", price: 190, discount: "5%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Netmeds", price: 182, discount: "10%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "PharmEasy", price: 195, discount: "2%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Tata 1MG", price: 187, discount: "5%", dosageForm: "Tablet", quantity: "10 tabs" }
  ],
  "Glimepiride": [
    { pharmacy: "Apollo Pharmacy", price: 105, discount: "4%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Netmeds", price: 100, discount: "8%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "PharmEasy", price: 108, discount: "2%", dosageForm: "Tablet", quantity: "10 tabs" },
    { pharmacy: "Tata 1MG", price: 102, discount: "6%", dosageForm: "Tablet", quantity: "10 tabs" }
  ],
  "Vitamin D3": [
    { pharmacy: "Apollo Pharmacy", price: 290, discount: "5%", dosageForm: "Capsule", quantity: "10 caps" },
    { pharmacy: "Netmeds", price: 280, discount: "8%", dosageForm: "Capsule", quantity: "10 caps" },
    { pharmacy: "PharmEasy", price: 295, discount: "3%", dosageForm: "Capsule", quantity: "10 caps" },
    { pharmacy: "Tata 1MG", price: 285, discount: "5%", dosageForm: "Capsule", quantity: "10 caps" }
  ],
  "Amoxicillin": [
    { pharmacy: "Apollo Pharmacy", price: 120, discount: "5%", dosageForm: "Capsule", quantity: "10 caps" },
    { pharmacy: "Netmeds", price: 110, discount: "10%", dosageForm: "Capsule", quantity: "10 caps" },
    { pharmacy: "PharmEasy", price: 125, discount: "3%", dosageForm: "Capsule", quantity: "10 caps" },
    { pharmacy: "Tata 1MG", price: 118, discount: "7%", dosageForm: "Capsule", quantity: "10 caps" }
  ]
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  const SessionStore = MemoryStore(session);
  app.use(
    session({
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      secret: process.env.SESSION_SECRET || "medicaresecret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Auth Middleware
  app.use(validateAuth);

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: validation.error.errors 
        });
      }
      
      const { username, email, password } = validation.data;
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // User Profile Routes (Protected)
  app.get("/api/users/profile", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  app.patch("/api/users/profile", requireAuth, async (req, res) => {
    try {
      const validation = updateUserSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: validation.error.errors 
        });
      }
      
      const updateData = validation.data;
      
      // Hash password if provided
      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      }
      
      // Update user
      const user = await storage.updateUser(req.session.userId!, updateData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.patch("/api/users/settings", requireAuth, async (req, res) => {
    try {
      const { theme } = req.body;
      
      if (!theme || !['light', 'dark'].includes(theme)) {
        return res.status(400).json({ message: "Invalid theme setting" });
      }
      
      const user = await storage.updateUser(req.session.userId!, { theme });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.delete("/api/users/profile", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteUser(req.session.userId!);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Clear session
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
      });
      
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Prescription Routes (Protected)
  app.get("/api/prescriptions", requireAuth, async (req, res) => {
    try {
      const prescriptions = await storage.getPrescriptionsByUserId(req.session.userId!);
      res.json(prescriptions);
    } catch (error) {
      console.error("Get prescriptions error:", error);
      res.status(500).json({ message: "Failed to get prescriptions" });
    }
  });

  app.post("/api/prescriptions", requireAuth, async (req, res) => {
    try {
      const validation = insertPrescriptionSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: validation.error.errors 
        });
      }
      
      const prescriptionData = validation.data;
      
      const prescription = await storage.createPrescription({
        ...prescriptionData,
        userId: req.session.userId!,
        isActive: true,
      });
      
      res.status(201).json(prescription);
    } catch (error) {
      console.error("Create prescription error:", error);
      res.status(500).json({ message: "Failed to create prescription" });
    }
  });

  app.patch("/api/prescriptions/:id", requireAuth, async (req, res) => {
    try {
      const prescriptionId = parseInt(req.params.id);
      
      if (isNaN(prescriptionId)) {
        return res.status(400).json({ message: "Invalid prescription ID" });
      }
      
      const validation = insertPrescriptionSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: validation.error.errors 
        });
      }
      
      // Check if prescription exists and belongs to user
      const existing = await storage.getPrescription(prescriptionId);
      
      if (!existing) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      if (existing.userId !== req.session.userId) {
        return res.status(403).json({ message: "You don't have permission to update this prescription" });
      }
      
      const prescription = await storage.updatePrescription(prescriptionId, validation.data);
      
      res.json(prescription);
    } catch (error) {
      console.error("Update prescription error:", error);
      res.status(500).json({ message: "Failed to update prescription" });
    }
  });

  app.delete("/api/prescriptions/:id", requireAuth, async (req, res) => {
    try {
      const prescriptionId = parseInt(req.params.id);
      
      if (isNaN(prescriptionId)) {
        return res.status(400).json({ message: "Invalid prescription ID" });
      }
      
      // Check if prescription exists and belongs to user
      const existing = await storage.getPrescription(prescriptionId);
      
      if (!existing) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      if (existing.userId !== req.session.userId) {
        return res.status(403).json({ message: "You don't have permission to delete this prescription" });
      }
      
      const success = await storage.deletePrescription(prescriptionId);
      
      if (!success) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      res.json({ message: "Prescription deleted successfully" });
    } catch (error) {
      console.error("Delete prescription error:", error);
      res.status(500).json({ message: "Failed to delete prescription" });
    }
  });

  // Mark prescription as taken
  app.post("/api/prescriptions/:id/taken", requireAuth, async (req, res) => {
    try {
      const prescriptionId = parseInt(req.params.id);
      
      if (isNaN(prescriptionId)) {
        return res.status(400).json({ message: "Invalid prescription ID" });
      }
      
      // Check if prescription exists and belongs to user
      const existing = await storage.getPrescription(prescriptionId);
      
      if (!existing) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      if (existing.userId !== req.session.userId) {
        return res.status(403).json({ message: "You don't have permission to update this prescription" });
      }
      
      // In a real app, we would track this in a medication log
      // For this implementation, we'll just return success
      res.json({ message: "Medication marked as taken" });
    } catch (error) {
      console.error("Mark taken error:", error);
      res.status(500).json({ message: "Failed to mark medication as taken" });
    }
  });

  // Snooze prescription reminder
  app.post("/api/prescriptions/:id/snooze", requireAuth, async (req, res) => {
    try {
      const prescriptionId = parseInt(req.params.id);
      
      if (isNaN(prescriptionId)) {
        return res.status(400).json({ message: "Invalid prescription ID" });
      }
      
      // Check if prescription exists and belongs to user
      const existing = await storage.getPrescription(prescriptionId);
      
      if (!existing) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      if (existing.userId !== req.session.userId) {
        return res.status(403).json({ message: "You don't have permission to update this prescription" });
      }
      
      // In a real app, we would update the reminder time
      // For this implementation, we'll just return success
      res.json({ message: "Reminder snoozed successfully" });
    } catch (error) {
      console.error("Snooze reminder error:", error);
      res.status(500).json({ message: "Failed to snooze reminder" });
    }
  });

  // Price Comparison Routes
  app.post("/api/price-comparison/search", requireAuth, async (req, res) => {
    try {
      const validation = insertPriceComparisonSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: validation.error.errors 
        });
      }
      
      const { medicineName } = validation.data;
      
      // Add to search history
      await storage.createPriceComparison({
        medicineName,
        userId: req.session.userId!,
      });
      
      // Find medicine prices
      // Use exact match or closest match in the mock data
      let prices = pharmacyData[medicineName as keyof typeof pharmacyData];
      
      if (!prices) {
        // Case-insensitive search for partial matches
        const medicineKey = Object.keys(pharmacyData).find(
          key => key.toLowerCase().includes(medicineName.toLowerCase())
        );
        
        if (medicineKey) {
          prices = pharmacyData[medicineKey as keyof typeof pharmacyData];
        } else {
          // No match found
          return res.json({
            medicineName,
            prices: [],
            lowestPrice: null
          });
        }
      }
      
      // Find lowest price
      const lowestPrice = Math.min(...prices.map(item => item.price));
      
      res.json({
        medicineName,
        prices,
        lowestPrice
      });
    } catch (error) {
      console.error("Price comparison error:", error);
      res.status(500).json({ message: "Failed to search medicine prices" });
    }
  });

  app.get("/api/price-comparisons/recent", requireAuth, async (req, res) => {
    try {
      const recentSearches = await storage.getRecentPriceComparisons(req.session.userId!);
      
      // Add price data to each search
      const searchesWithPrices = recentSearches.map(search => {
        // Find medicine prices
        let prices = pharmacyData[search.medicineName as keyof typeof pharmacyData];
        
        if (!prices) {
          // Case-insensitive search for partial matches
          const medicineKey = Object.keys(pharmacyData).find(
            key => key.toLowerCase().includes(search.medicineName.toLowerCase())
          );
          
          if (medicineKey) {
            prices = pharmacyData[medicineKey as keyof typeof pharmacyData];
          } else {
            // No match found
            prices = [];
          }
        }
        
        // Find lowest price
        const lowestPrice = prices.length > 0 
          ? Math.min(...prices.map(item => item.price))
          : null;
        
        return {
          ...search,
          prices,
          lowestPrice
        };
      });
      
      res.json(searchesWithPrices);
    } catch (error) {
      console.error("Recent price comparisons error:", error);
      res.status(500).json({ message: "Failed to get recent price comparisons" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server on a distinct path to avoid conflict with HMR
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    // Ensure WebSocket server is properly listening for connections
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      clientNoContextTakeover: true,
      serverNoContextTakeover: true,
      serverMaxWindowBits: 10,
      concurrencyLimit: 10,
      threshold: 1024
    }
  });
  
  // Log when WebSocket server is ready
  log('WebSocket server initialized on path: /ws', 'ws');
  
  // Clients connected to the WebSocket server
  const clients = new Set<WebSocket>();
  
  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket, req) => {
    log(`WebSocket client connected from ${req.socket.remoteAddress}`, 'ws');
    
    // Add to clients set
    clients.add(ws);
    
    // Handle connection closing
    ws.on('close', () => {
      log('WebSocket client disconnected', 'ws');
      clients.delete(ws);
    });
    
    // Handle messages from client
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        log(`Received message: ${JSON.stringify(data)}`, 'ws');
        
        // Echo back for testing
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'echo', data }));
        }
      } catch (error) {
        log(`Error processing message: ${error}`, 'ws');
      }
    });
    
    // Send welcome message
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'info', 
        message: 'Connected to MediCare Assistant WebSocket server' 
      }));
    }
  });
  
  // Broadcast to all connected clients
  const broadcastToAll = (data: any) => {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };
  
  // Periodic health check
  setInterval(() => {
    const timestamp = new Date().toISOString();
    log(`Sending heartbeat to ${clients.size} clients`, 'ws');
    
    broadcastToAll({
      type: 'heartbeat',
      timestamp
    });
  }, 30000); // Every 30 seconds
  
  return httpServer;
}
