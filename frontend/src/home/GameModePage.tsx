import "./GameModePage.css";

interface GameModePageProps {
  entryFee: number;
  onBot: () => void;
  onFriend: () => void;
  onOnline: () => void;
  onBack: () => void;
}

export default function GameModePage({
  entryFee,
  onBot,
  onFriend,
  onOnline,
  onBack
}: GameModePageProps) {
  return (
    <main className="game-mode-page">
      <section className="game-mode-content">

        <button
          type="button"
          className="game-mode-back"
          onClick={onBack}
        >
          ← BACK
        </button>

        <div className="game-mode-header">
          <span className="game-mode-eyebrow">
            ENTRY {entryFee.toLocaleString()} COINS
          </span>

          <h1>CHOOSE GAME MODE</h1>

          <p>
            How would you like to play?
          </p>
        </div>

        <div className="game-mode-options">

          <button
            type="button"
            className="game-mode-card"
            onClick={onBot}
          >
            <span className="game-mode-icon">🤖</span>

            <span className="game-mode-card-text">
              <strong>PLAY WITH BOT</strong>
              <small>Practice against a computer player</small>
            </span>

            <span className="game-mode-arrow">→</span>
          </button>

          <button
            type="button"
            className="game-mode-card"
            onClick={onFriend}
          >
            <span className="game-mode-icon">👥</span>

            <span className="game-mode-card-text">
              <strong>PLAY WITH FRIEND</strong>
              <small>Create a private room and invite your friend</small>
            </span>

            <span className="game-mode-arrow">→</span>
          </button>

          <button
            type="button"
            className="game-mode-card"
            onClick={onOnline}
          >
            <span className="game-mode-icon">🌐</span>

            <span className="game-mode-card-text">
              <strong>ONLINE PLAYER</strong>
              <small>Find another player at this entry level</small>
            </span>

            <span className="game-mode-arrow">→</span>
          </button>

        </div>

        <footer className="game-mode-footer">
          RUMMY • 13 CARD GAME
        </footer>

      </section>
    </main>
  );
}
