import { users, prescriptions, priceComparisons, type User, type InsertUser, type Prescription, type PriceComparison, type UpdateUser } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: UpdateUser): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Prescription methods
  getPrescription(id: number): Promise<Prescription | undefined>;
  getPrescriptionsByUserId(userId: number): Promise<Prescription[]>;
  createPrescription(prescription: Omit<Prescription, "id">): Promise<Prescription>;
  updatePrescription(id: number, data: Partial<Omit<Prescription, "id" | "userId">>): Promise<Prescription | undefined>;
  deletePrescription(id: number): Promise<boolean>;
  
  // Price comparison methods
  createPriceComparison(comparison: Omit<PriceComparison, "id" | "createdAt">): Promise<PriceComparison>;
  getRecentPriceComparisons(userId: number, limit?: number): Promise<PriceComparison[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private prescriptions: Map<number, Prescription>;
  private priceComparisons: Map<number, PriceComparison>;
  
  private userIdCounter: number;
  private prescriptionIdCounter: number;
  private priceComparisonIdCounter: number;

  constructor() {
    this.users = new Map();
    this.prescriptions = new Map();
    this.priceComparisons = new Map();
    
    this.userIdCounter = 1;
    this.prescriptionIdCounter = 1;
    this.priceComparisonIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      theme: "light" 
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: UpdateUser): Promise<User | undefined> {
    const user = await this.getUser(id);
    
    if (!user) {
      return undefined;
    }
    
    const updatedUser: User = {
      ...user,
      ...data
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // Delete user
    const userDeleted = this.users.delete(id);
    
    if (!userDeleted) {
      return false;
    }
    
    // Delete all user's prescriptions
    Array.from(this.prescriptions.entries()).forEach(([prescriptionId, prescription]) => {
      if (prescription.userId === id) {
        this.prescriptions.delete(prescriptionId);
      }
    });
    
    // Delete all user's price comparisons
    Array.from(this.priceComparisons.entries()).forEach(([comparisonId, comparison]) => {
      if (comparison.userId === id) {
        this.priceComparisons.delete(comparisonId);
      }
    });
    
    return true;
  }
  
  // Prescription methods
  async getPrescription(id: number): Promise<Prescription | undefined> {
    return this.prescriptions.get(id);
  }
  
  async getPrescriptionsByUserId(userId: number): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(
      (prescription) => prescription.userId === userId
    );
  }
  
  async createPrescription(prescription: Omit<Prescription, "id">): Promise<Prescription> {
    const id = this.prescriptionIdCounter++;
    const newPrescription: Prescription = {
      ...prescription,
      id,
      isActive: true
    };
    
    this.prescriptions.set(id, newPrescription);
    return newPrescription;
  }
  
  async updatePrescription(
    id: number, 
    data: Partial<Omit<Prescription, "id" | "userId">>
  ): Promise<Prescription | undefined> {
    const prescription = await this.getPrescription(id);
    
    if (!prescription) {
      return undefined;
    }
    
    const updatedPrescription: Prescription = {
      ...prescription,
      ...data
    };
    
    this.prescriptions.set(id, updatedPrescription);
    return updatedPrescription;
  }
  
  async deletePrescription(id: number): Promise<boolean> {
    return this.prescriptions.delete(id);
  }
  
  // Price comparison methods
  async createPriceComparison(
    comparison: Omit<PriceComparison, "id" | "createdAt">
  ): Promise<PriceComparison> {
    const id = this.priceComparisonIdCounter++;
    const newComparison: PriceComparison = {
      ...comparison,
      id,
      createdAt: new Date()
    };
    
    this.priceComparisons.set(id, newComparison);
    return newComparison;
  }
  
  async getRecentPriceComparisons(userId: number, limit: number = 5): Promise<PriceComparison[]> {
    return Array.from(this.priceComparisons.values())
      .filter((comparison) => comparison.userId === userId)
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
