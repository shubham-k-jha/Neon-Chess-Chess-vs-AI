# ♟️ Neon Chess — Chess vs AI

A polished, dependency-free browser chess game built from the original local two-player project and upgraded with a real chess search engine.

## 🎮 Play Online

**[Play Neon Pong](https://shubham-k-jha.github.io/Neon-Chess-Chess-vs-AI/)**

## Features

- Human (White) vs AI (Black)
- Exactly **100 selectable AI levels**
- Shared authoritative legal-move generator for UI and AI
- Pawn, knight, bishop, rook, queen and king movement
- Check, checkmate and stalemate
- Castling
- En passant
- Promotion to queen, rook, bishop or knight
- Threefold repetition
- Fifty-move draw
- Insufficient-material draw detection
- Move history and captured pieces
- Undo to the previous player decision point
- Restart / new game
- Board flip
- Responsive desktop/tablet/mobile UI
- AI thinking indicator
- Web Worker AI so search runs away from the main UI thread
- Alpha-beta search with iterative deepening
- Move ordering
- Quiescence search
- Transposition table
- Position evaluation using material, piece-square tables, center control and mobility
- Local difficulty preference storage

## AI difficulty

Levels scale the engine's search budget and configuration rather than merely changing a delay.

| Levels | Description |
|---|---|
| 1–10 | Beginner |
| 11–25 | Easy |
| 26–40 | Intermediate |
| 41–55 | Advanced |
| 56–70 | Strong |
| 71–85 | Very Strong |
| 86–95 | Expert |
| 96–100 | Maximum Engine Strength |

**Level 100 is the strongest practical configuration of this browser engine. It is not a claimed Elo, Stockfish-equivalent, or perfect-chess rating.**

## Engine architecture

- `js/engine.js` — authoritative board state, legal move generation, rules, evaluation and search
- `js/worker.js` — Web Worker wrapper around the engine search
- `js/game.js` — UI, interaction, game flow, AI orchestration and persistence
- `css/style.css` — responsive visual design
- `index.html` — main game
- `play.html` — landing page

The AI uses iterative deepening within a level-dependent time budget. Higher levels receive deeper search targets, more time, reduced randomness and the full evaluation/search configuration.

## Controls

- Click a piece to select it.
- Click a highlighted destination to move.
- Use **Undo** to return to the previous player decision point.
- **Flip** changes board orientation.
- Use the difficulty slider to select Levels 1–100.

## Run locally

No build step is required.

```bash
python -m http.server 8000
```

Open:

```text
http://localhost:8000/
```

Using a local HTTP server is recommended because the AI uses a Web Worker.

## GitHub Pages

1. Push the project to GitHub.
2. Open **Settings → Pages**.
3. Choose **GitHub Actions** if using the included workflow, or deploy `main` → `/root` with the standard Pages branch option.
4. Open the generated Pages URL.

## Testing performed

The included engine tests cover:

- Initial legal move count
- Basic move/capture flow
- Castling
- En passant
- Promotion
- Checkmate
- AI move legality
- AI Levels 1, 25, 50, 75 and 100 returning legal moves

The test files are under `tests/`.

## Known limitations

This is a custom browser chess engine, not Stockfish. Search strength is bounded by browser performance and the configured time budget. No Elo rating is claimed.

A full browser click-through test could not be completed in the current execution environment because its Chromium process does not terminate reliably in headless mode. The core engine tests were executed successfully with Node.js.
