// Register File Management

import { RegisterName } from '../types/cpu';

export class RegisterFile {
  private values: Record<RegisterName, number>;
  private modifiedRegisters: Set<RegisterName> = new Set();

  constructor() {
    this.values = this.createInitialValues();
  }

  private createInitialValues(): Record<RegisterName, number> {
    return {
      R0: 0,
      R1: 0,
      R2: 0,
      R3: 0,
      R4: 0,
      R5: 0,
      PC: 0x00,
      IR: 0x00,
      SP: 0xFF, // Stack starts at the top of memory
      BP: 0xFF,
      MAR: 0x00,
      MBR: 0x00
    };
  }

  public reset(): void {
    this.values = this.createInitialValues();
    this.modifiedRegisters.clear();
  }

  public get(name: RegisterName): number {
    return this.values[name] ?? 0;
  }

  public set(name: RegisterName, value: number): void {
    this.values[name] = value;
    this.modifiedRegisters.add(name);
  }

  public clearModified(): void {
    this.modifiedRegisters.clear();
  }

  public isModified(name: RegisterName): boolean {
    return this.modifiedRegisters.has(name);
  }

  public getAll(): Record<RegisterName, number> {
    return { ...this.values };
  }

  public clone(): RegisterFile {
    const rf = new RegisterFile();
    rf.values = { ...this.values };
    rf.modifiedRegisters = new Set(this.modifiedRegisters);
    return rf;
  }
}
