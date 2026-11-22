# tiny-stack-vm

A small, exact interpreter for make.fun's tiny stack ISA (v1), plain
TypeScript for Node 22, standard library only.

`main.ts` answers a whole set in one run: it reads `<id>/program.bin` and
`<id>/input.bin` from `MAKEFUN_INPUT_DIR` (default `/input`) and writes
`<id>/stdout.bin` and `<id>/exit.txt` to `MAKEFUN_OUTPUT_DIR`
(default `/output`). It implements the ISA faithfully: wrapping 32-bit
arithmetic (exact `MUL`, true unsigned `DIVU`/`MODU`/`LTU`), all ten traps
with their own exit codes, the 256-value stack, 64-deep call stack,
256-word memory, the step limit and the output limit.

Run: `MAKEFUN_INPUT_DIR=practice/input MAKEFUN_OUTPUT_DIR=out node main.ts`

MIT, see LICENSE.
