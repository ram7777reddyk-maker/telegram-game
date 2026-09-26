import "./HomePage.css";

interface HomePageProps {
  walletBalance: number;
  onPlayRoom: (entryFee: number) => void;
  onWallet: () => void;
  onProfile: () => void;
  onLogout: () => void;
}

const rooms = [
  {
    name: "BRONZE",
    entryFee: 500,
    description: "Quick Table"
  },
  {
    name: "SILVER",
    entryFee: 1000,
    description: "Silver Table"
  },
  {
    name: "GOLD",
    entryFee: 2000,
    description: "Gold Table"
  },
  {
    name: "DIAMOND",
    entryFee: 5000,
    description: "Premium Table"
  }
];

export default function HomePage({
  walletBalance,
  onPlayRoom,
  onWallet,
  onProfile,
  onLogout
}: HomePageProps) {
  return (
    <main className="home-page">
      <header className="home-header">
        <div className="home-brand">
          <div className="home-brand-symbol">R</div>

          <div>
            <h1>RUMMY</h1>
            <span>13 CARD RUMMY</span>
          </div>
        </div>

        <div className="wallet-badge">
          <span className="wallet-icon">COINS</span>

          <div>
            <small>BALANCE</small>
            <strong>{walletBalance.toLocaleString()}</strong>
          </div>
        </div>
      </header>

      <section className="room-section">
        <div className="room-heading">
          <span className="room-heading-line" />
          <h2>CHOOSE ROOM</h2>
          <span className="room-heading-line" />
        </div>

        <p className="room-subtitle">
          Choose your table and start playing
        </p>

        <div className="room-grid">
          {rooms.map((room) => {
            const canPlay = walletBalance >= room.entryFee;

            return (
              <article
                className={`room-card ${
                  !canPlay ? "room-card-locked" : ""
                }`}
                key={room.name}
              >
                <div className="room-card-top">
                  <span className="room-level">
                    {room.name}
                  </span>

                  {!canPlay && (
                    <span className="room-lock">
                      LOCKED
                    </span>
                  )}
                </div>

                <div className="room-entry">
                  <span className="coin-label">COINS</span>
                  {room.entryFee.toLocaleString()}
                </div>

                <p>{room.description}</p>

                <button
                  type="button"
                  disabled={!canPlay}
                  onClick={() => onPlayRoom(room.entryFee)}
                >
                  {canPlay ? "PLAY" : "NOT ENOUGH COINS"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <nav className="home-nav">
        <button
          type="button"
          className="home-nav-active"
        >
          <span>HOME</span>
          <small>HOME</small>
        </button>

        <button type="button">
          <span>GAME</span>
          <small>GAMES</small>
        </button>

        <button
          type="button"
          onClick={onWallet}
        >
          <span>COINS</span>
          <small>WALLET</small>
        </button>

        <button
          type="button"
          onClick={onProfile}
        >
          <span>USER</span>
          <small>PROFILE</small>
        </button>
      </nav>

      <button
        type="button"
        className="home-logout"
        onClick={onLogout}
      >
        LOG OUT
      </button>
    </main>
  );
}
