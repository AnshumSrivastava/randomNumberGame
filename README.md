# Random Number Guessing Game

A collection of number-guessing challenges where logic, deduction, and strategy matter more than luck.

Built with React + Vite.

## Game Modes

### Normal Mode

The classic guessing game.

- The computer selects a random number between 1 and 100.
- Enter your guess. You have 10 attempts.
- The game tells you whether the correct number is higher (`↑`) or lower (`↓`).
- All previous guesses and hints are tracked in order.
- Continue narrowing the range until you find the exact number.

---

### Digit Mode

A number-based deduction challenge.

- The computer generates a hidden 4- or 5-digit number (your choice).
- Submit a guess with the same number of digits.
- The game reveals only which digits are correct **and** in the correct position (`■`).
- If a digit exists but is in the wrong position — no hint is given.
- Use pure deduction from exact matches to uncover the full number.
- You have 8 attempts.

---

### Sneaky Mode

The number is never fixed.

- After every guess, the hidden number may change — but it must remain consistent with all previous answers.
- Example:
  - You guess `500`. The game responds `↑ Higher`.
  - The hidden number can now be any value above 500.
  - On your next guess, the game again picks whichever answer leaves the most possibilities open.
- Your goal is not to find the original number, but to **force the game into a corner** until only one valid number remains — then guess it.
- Challenges your ability to eliminate possibilities and trap the system through pure logic.

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Building for Production

```bash
npm run build
```

Output is placed in the `dist/` directory.

## Tech Stack

- [React](https://react.dev/) — UI components and state management
- [Vite](https://vitejs.dev/) — build tool and dev server
- Vanilla CSS — no external UI libraries

## License

GPL-3.0 — see [LICENSE](./LICENSE).
