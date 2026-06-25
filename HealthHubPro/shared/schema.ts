import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  theme: text("theme").default("light"),
});

export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  medicineName: text("medicine_name").notNull(),
  dosageForm: text("dosage_form").notNull(),
  quantity: text("quantity").notNull(),
  units: text("units").notNull(),
  reminderTime: text("reminder_time").notNull(),
  frequency: text("frequency").notNull(),
  isActive: boolean("is_active").default(true),
});

export const priceComparisons = pgTable("price_comparisons", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  medicineName: text("medicine_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  userId: true,
  isActive: true,
});

export const insertPriceComparisonSchema = createInsertSchema(priceComparisons).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const updateUserSchema = z.object({
  username: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().optional(),
  theme: z.enum(["light", "dark"]).optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

export type PriceComparison = typeof priceComparisons.$inferSelect;
export type InsertPriceComparison = z.infer<typeof insertPriceComparisonSchema>;

export type UpdateUser = z.infer<typeof updateUserSchema>;

// Pharmacy type for price comparison
export type PharmacyPrice = {
  pharmacy: string;
  price: number;
  discount: string;
  dosageForm: string;
  quantity: string;
};

export type SnoozeOptions = {
  duration: number; // snooze duration in minutes
  until: Date;     // snooze until specific time
  active: boolean;  // whether snooze is active
};
