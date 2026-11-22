export class RegisterFile {
  values;
  modifiedRegisters = /* @__PURE__ */ new Set();
  constructor() {
    this.values = this.createInitialValues();
  }
  createInitialValues() {
    return {
      R0: 0,
      R1: 0,
      R2: 0,
      R3: 0,
      R4: 0,
      R5: 0,
      PC: 0,
      IR: 0,
      SP: 255,
      // Stack starts at the top of memory
      BP: 255,
      MAR: 0,
      MBR: 0
    };
  }
  reset() {
    this.values = this.createInitialValues();
    this.modifiedRegisters.clear();
  }
  get(name) {
    return this.values[name] ?? 0;
  }
  set(name, value) {
    this.values[name] = value;
    this.modifiedRegisters.add(name);
  }
  clearModified() {
    this.modifiedRegisters.clear();
  }
  isModified(name) {
    return this.modifiedRegisters.has(name);
  }
  getAll() {
    return { ...this.values };
  }
  clone() {
    const rf = new RegisterFile();
    rf.values = { ...this.values };
    rf.modifiedRegisters = new Set(this.modifiedRegisters);
    return rf;
  }
}
