# Chess Game

A complete, beginner-friendly chess game using only HTML, CSS, and vanilla JavaScript. Open `index.html` directly in a browser—no Node.js, backend, framework, database, or authentication is required.

## Features

- Interactive 8×8 board with click-to-move controls
- Legal movement for pawns, knights, bishops, rooks, queens, and kings
- Captures and captured-piece display
- Check, checkmate, and stalemate detection
- Castling on both sides
- En passant
- Promotion to queen, rook, bishop, or knight
- Undo, new game, and board flip controls
- Move history in simple algebraic notation
- Threefold repetition and insufficient-material draw detection
- Responsive desktop, tablet, and mobile layout
- Keyboard-accessible buttons, visible focus states, and ARIA labels

## Tech Stack

HTML5, CSS3, and vanilla JavaScript. No external libraries or CDN dependencies are used.

## How to Run

1. Clone or download this repository.
2. Open `index.html` in a modern web browser.
3. Click a piece, then click a highlighted destination square.

## GitHub Pages

Open the repository's **Settings → Pages**, select the `main` branch and the repository root (`/`), then save. GitHub Pages will publish `index.html` as the site entry point.

## Project Structure

- `index.html` — application markup and controls
- `style.css` — responsive visual design and board styling
- `script.js` — board state, legal move generation, special moves, rendering, and controls
- `README.md` — project documentation

## Implemented Chess Rules

The implementation validates moves against check, prevents pinned pieces from exposing the king, handles normal movement and captures, castling rights, en passant, promotion choice, checkmate, stalemate, threefold repetition, and basic insufficient-material draws. The 50-move rule is intentionally not claimed as implemented.
