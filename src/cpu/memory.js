export class MemoryUnit {
  cells = [];
  constructor(initialCells) {
    if (initialCells && initialCells.length === 256) {
      this.cells = initialCells.map((c) => ({ ...c }));
    } else {
      this.initDefault();
    }
  }
  initDefault() {
    this.cells = [];
    for (let i = 0; i < 256; i++) {
      let segment = "data";
      if (i < 128) segment = "code";
      else if (i >= 208) segment = "stack";
      this.cells.push({
        address: i,
        value: 0,
        segment,
        lastAccessed: null
      });
    }
  }
  read(address) {
    const clamped = Math.max(0, Math.min(255, address));
    this.cells[clamped].lastAccessed = "read";
    return this.cells[clamped].value;
  }
  write(address, value) {
    const clamped = Math.max(0, Math.min(255, address));
    this.cells[clamped].value = value;
    this.cells[clamped].lastAccessed = "write";
  }
  getCell(address) {
    return this.cells[address];
  }
  getCells() {
    return this.cells.map((c) => ({ ...c }));
  }
  clearAccessFlags() {
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i].lastAccessed = null;
    }
  }
  clone() {
    const copy = new MemoryUnit();
    copy.cells = this.cells.map((c) => ({ ...c }));
    return copy;
  }
}
