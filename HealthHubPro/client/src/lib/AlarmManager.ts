// AlarmManager.ts - Handles local storage alarm persistence

interface MedicationAlarm {
  id: number;
  name: string;
  dosage: string;
  time: string;  // HH:MM format
  timeoutId?: number;
}

// Singleton for alarm management
export class AlarmManager {
  private static instance: AlarmManager;
  private alarms: MedicationAlarm[] = [];
  private listeners: Set<(alarms: MedicationAlarm[]) => void> = new Set();
  private storageKey = 'medication_alarms';

  private constructor() {
    // Load existing alarms from localStorage on initialization
    this.loadAlarms();
  }

  public static getInstance(): AlarmManager {
    if (!AlarmManager.instance) {
      AlarmManager.instance = new AlarmManager();
    }
    return AlarmManager.instance;
  }

  // Load alarms from localStorage
  private loadAlarms(): void {
    try {
      const storedAlarms = localStorage.getItem(this.storageKey);
      if (storedAlarms) {
        this.alarms = JSON.parse(storedAlarms);
        console.log('Loaded alarms from localStorage:', this.alarms);
      }
    } catch (error) {
      console.error('Failed to load alarms from localStorage:', error);
      this.alarms = [];
    }
  }

  // Save alarms to localStorage
  private saveAlarms(): void {
    try {
      // Remove timeoutId before saving as it's not serializable
      const alarmsToSave = this.alarms.map(({ timeoutId, ...alarm }) => alarm);
      localStorage.setItem(this.storageKey, JSON.stringify(alarmsToSave));
      console.log('Saved alarms to localStorage:', alarmsToSave);
    } catch (error) {
      console.error('Failed to save alarms to localStorage:', error);
    }
  }

  // Get all alarms
  public getAlarms(): MedicationAlarm[] {
    return [...this.alarms];
  }

  // Add a new alarm
  public addAlarm(alarm: Omit<MedicationAlarm, 'timeoutId'>): MedicationAlarm {
    const newAlarm = { ...alarm };
    
    // Check if the alarm already exists
    const existingIndex = this.alarms.findIndex(a => a.id === alarm.id);
    if (existingIndex >= 0) {
      // Update existing alarm
      this.alarms[existingIndex] = { ...this.alarms[existingIndex], ...newAlarm };
    } else {
      // Add new alarm
      this.alarms.push(newAlarm);
    }
    
    this.saveAlarms();
    this.notifyListeners();
    return newAlarm;
  }

  // Update an existing alarm
  public updateAlarm(id: number, update: Partial<Omit<MedicationAlarm, 'id'>>): boolean {
    const index = this.alarms.findIndex(a => a.id === id);
    if (index >= 0) {
      this.alarms[index] = { ...this.alarms[index], ...update };
      this.saveAlarms();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // Remove an alarm
  public removeAlarm(id: number): boolean {
    const index = this.alarms.findIndex(a => a.id === id);
    if (index >= 0) {
      this.alarms.splice(index, 1);
      this.saveAlarms();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // Set timeout ID for an alarm
  public setAlarmTimeoutId(id: number, timeoutId: number): boolean {
    return this.updateAlarm(id, { timeoutId });
  }

  // Add a change listener
  public addChangeListener(listener: (alarms: MedicationAlarm[]) => void): void {
    this.listeners.add(listener);
  }

  // Remove a change listener
  public removeChangeListener(listener: (alarms: MedicationAlarm[]) => void): void {
    this.listeners.delete(listener);
  }

  // Notify all listeners of changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getAlarms()));
  }

  // Clear all alarms
  public clearAll(): void {
    this.alarms = [];
    this.saveAlarms();
    this.notifyListeners();
  }
}

// Export a singleton instance
export const alarmManager = AlarmManager.getInstance();