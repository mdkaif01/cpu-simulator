// Memory Unit Implementation

import { MemoryCell } from '../types/cpu';

export class MemoryUnit {
  private cells: MemoryCell[] = [];

  constructor(initialCells?: MemoryCell[]) {
    if (initialCells && initialCells.length === 256) {
      this.cells = initialCells.map((c) => ({ ...c }));
    } else {
      this.initDefault();
    }
  }

  private initDefault(): void {
    this.cells = [];
    for (let i = 0; i < 256; i++) {
      let segment: 'code' | 'data' | 'stack' = 'data';
      if (i < 0x80) segment = 'code';
      else if (i >= 0xD0) segment = 'stack';

      this.cells.push({
        address: i,
        value: 0,
        segment,
        lastAccessed: null
      });
    }
  }

  public read(address: number): number {
    const clamped = Math.max(0, Math.min(255, address));
    this.cells[clamped].lastAccessed = 'read';
    return this.cells[clamped].value;
  }

  public write(address: number, value: number): void {
    const clamped = Math.max(0, Math.min(255, address));
    this.cells[clamped].value = value;
    this.cells[clamped].lastAccessed = 'write';
  }

  public getCell(address: number): MemoryCell | undefined {
    return this.cells[address];
  }

  public getCells(): MemoryCell[] {
    return this.cells.map((c) => ({ ...c }));
  }

  public clearAccessFlags(): void {
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i].lastAccessed = null;
    }
  }

  public clone(): MemoryUnit {
    const copy = new MemoryUnit();
    copy.cells = this.cells.map((c) => ({ ...c }));
    return copy;
  }
}
