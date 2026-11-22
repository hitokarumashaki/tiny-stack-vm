// tiny-stack-vm: a small, exact interpreter for make.fun's tiny stack ISA v1.
// Node 22, standard library only. Answers a whole set in one run:
// MAKEFUN_INPUT_DIR (default /input) holds <id>/program.bin + <id>/input.bin;
// MAKEFUN_OUTPUT_DIR (default /output) gets <id>/stdout.bin + <id>/exit.txt.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const enc = new TextEncoder();

// Per-opcode [immediate bytes, values popped, values pushed], by opcode.
// Only the opcodes ISA v1 names are listed; anything else traps 5.
const IMM = new Uint8Array(84);
const POP = new Uint8Array(84);
const PSH = new Uint8Array(84);
for (const [op, imm, pop, psh] of [
  [1, 1, 0, 1], [2, 4, 0, 1],
  [3, 0, 1, 0], [4, 0, 1, 2], [5, 0, 2, 2], [6, 0, 2, 3], [7, 0, 3, 3],
  [16, 0, 2, 1], [17, 0, 2, 1], [18, 0, 2, 1], [19, 0, 2, 1], [20, 0, 2, 1],
  [21, 0, 2, 1], [22, 0, 2, 1], [23, 0, 1, 1], [24, 0, 2, 1], [25, 0, 2, 1],
  [26, 0, 2, 1], [27, 0, 1, 1], [28, 0, 2, 1], [29, 0, 2, 1], [30, 0, 2, 1],
  [32, 0, 2, 1], [33, 0, 2, 1], [34, 0, 2, 1],
  [48, 2, 0, 0], [49, 2, 1, 0], [50, 2, 1, 0], [51, 2, 0, 0],
  [64, 0, 1, 1], [65, 0, 2, 0],
  [80, 0, 1, 0], [81, 0, 1, 0], [82, 0, 0, 1], [83, 0, 1, 0],
]) { IMM[op] = imm; POP[op] = pop; PSH[op] = psh; }

function run(prog, input) {
  const D = new Int32Array(256); // data stack
  const C = new Int32Array(64); // call stack
  const M = new Int32Array(256); // memory
  const O = new Uint8Array(65536); // output bytes
  let sp = 0, cp = 0, ip = 0, pc = 0, steps = 0, olen = 0;
  const len = prog.length;
  const end = (code) => [O.slice(0, olen), code];
  for (;;) {
    if (steps === 1000000) return end(10);
    if (pc < 0 || pc >= len) return end(9);
    const op = prog[pc];
    // 0x1f is the one hole inside 0x10..0x22, so it is not a known opcode.
    const known = op < 8 || (op > 15 && op < 35 && op !== 31) || (op > 47 && op < 53) ||
      (op > 63 && op < 66) || (op > 79 && op < 84);
    if (!known) return end(5);
    const imm = IMM[op];
    if (pc + imm >= len) return end(9);
    steps++;
    const next = pc + 1 + imm;
    if (sp < POP[op]) return end(2);
    if (sp - POP[op] + PSH[op] > 256) return end(3);
    pc = next;
    switch (op) {
      case 0: return end(0);
      case 1: D[sp++] = (prog[next - 1] << 24) >> 24; break;
      case 2: D[sp++] = prog[next - 4] | (prog[next - 3] << 8) | (prog[next - 2] << 16) | (prog[next - 1] << 24); break;
      case 3: sp--; break;
      case 4: D[sp] = D[sp - 1]; sp++; break;
      case 5: { const t = D[sp - 1]; D[sp - 1] = D[sp - 2]; D[sp - 2] = t; break; }
      case 6: D[sp] = D[sp - 2]; sp++; break;
      case 7: { const a = D[sp - 3]; D[sp - 3] = D[sp - 2]; D[sp - 2] = D[sp - 1]; D[sp - 1] = a; break; }
      case 23: D[sp - 1] = (-D[sp - 1]) | 0; break;
      case 27: D[sp - 1] = ~D[sp - 1]; break;
      case 16: case 17: case 18: case 19: case 20: case 21: case 22:
      case 24: case 25: case 26: case 28: case 29: case 30:
      case 32: case 33: case 34: {
        const b = D[sp - 1], a = D[sp - 2];
        let r;
        if (op === 16) r = (a + b) | 0;
        else if (op === 17) r = (a - b) | 0;
        else if (op === 18) r = Math.imul(a, b); // exact low 32 bits
        else if (op === 19) { // signed, truncated toward zero
          if (b === 0) return end(4);
          r = a === -2147483648 && b === -1 ? a : (a / b) | 0;
        } else if (op === 20) { // sign of a
          if (b === 0) return end(4);
          r = b === -1 ? 0 : (a % b) | 0;
        } else if (op === 21) {
          if (b === 0) return end(4);
          r = Math.floor((a >>> 0) / (b >>> 0)) | 0;
        } else if (op === 22) {
          if (b === 0) return end(4);
          r = ((a >>> 0) % (b >>> 0)) | 0;
        } else if (op === 24) r = a & b;
        else if (op === 25) r = a | b;
        else if (op === 26) r = a ^ b;
        else if (op === 28) r = a << (b & 31);
        else if (op === 29) r = a >> (b & 31);
        else if (op === 30) r = (a >>> (b & 31)) | 0;
        else if (op === 32) r = a === b ? 1 : 0;
        else if (op === 33) r = a < b ? 1 : 0;
        else r = (a >>> 0) < (b >>> 0) ? 1 : 0;
        sp -= 2;
        D[sp++] = r;
        break;
      }
      case 48: case 49: case 50: {
        const rel = ((prog[next - 2] | (prog[next - 1] << 8)) << 16) >> 16;
        let take = op === 48;
        if (op !== 48) {
          const v = D[--sp];
          take = op === 49 ? v === 0 : v !== 0;
        }
        if (take) pc = next + rel;
        break;
      }
      case 51:
        if (cp === 64) return end(7);
        C[cp++] = next;
        pc = prog[next - 2] | (prog[next - 1] << 8);
        break;
      case 52:
        if (cp === 0) return end(8);
        pc = C[--cp];
        break;
      case 64: {
        const addr = D[sp - 1];
        if (addr < 0 || addr > 255) return end(6);
        D[sp - 1] = M[addr];
        break;
      }
      case 65: {
        const addr = D[sp - 1], v = D[sp - 2];
        if (addr < 0 || addr > 255) return end(6);
        sp -= 2;
        M[addr] = v;
        break;
      }
      case 80: {
        const bytes = enc.encode(String(D[sp - 1]));
        if (olen + bytes.length > 65536) return end(11);
        sp--;
        O.set(bytes, olen);
        olen += bytes.length;
        break;
      }
      case 81:
        if (olen + 1 > 65536) return end(11);
        O[olen++] = D[--sp] & 255;
        break;
      case 82:
        D[sp++] = ip < input.length ? input[ip++] : -1;
        break;
      case 83:
        return end(D[--sp] & 255);
      default: return end(5);
    }
  }
}

const IN_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const id of readdirSync(IN_DIR).sort()) {
  const [out, code] = run(
    new Uint8Array(readFileSync(join(IN_DIR, id, 'program.bin'))),
    new Uint8Array(readFileSync(join(IN_DIR, id, 'input.bin'))),
  );
  mkdirSync(join(OUT_DIR, id), { recursive: true });
  writeFileSync(join(OUT_DIR, id, 'stdout.bin'), out);
  writeFileSync(join(OUT_DIR, id, 'exit.txt'), `${code}\n`);
}
