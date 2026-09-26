interface GameOverOverlayProps {
  isWinner: boolean;
  winnerName: string;
}

export default function GameOverOverlay({
  isWinner,
  winnerName
}: GameOverOverlayProps) {
  return (
    <div className="game-over-overlay">
      <div className="game-over-card">

        <div className="game-over-trophy">
          {isWinner ? "🏆" : "🎴"}
        </div>

        <div className="game-over-title">
          GAME OVER
        </div>

        <div
          className={`game-over-result ${
            isWinner ? "winner" : "loser"
          }`}
        >
          {isWinner
            ? "YOU WIN!"
            : "GAME OVER"}
        </div>

        <div className="game-over-divider" />

        <div className="game-over-winner-label">
          WINNER
        </div>

        <div className="game-over-winner-name">
          👑 {winnerName}
        </div>

        <div className="game-over-valid">
          ✓ Valid Declaration
        </div>

        <div className="game-over-message">
          {isWinner
            ? "Congratulations! You completed a valid Rummy hand."
            : `${winnerName} completed a valid Rummy hand.`}
        </div>

      </div>
    </div>
  );
}
