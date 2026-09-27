import "./LandingPage.css";

interface LandingPageProps {
  onGuest: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}

const rooms = [
  { name: "BRONZE", entryFee: 500, description: "Quick Table" },
  { name: "SILVER", entryFee: 1000, description: "Silver Table" },
  { name: "GOLD", entryFee: 2000, description: "Gold Table" },
  { name: "DIAMOND", entryFee: 5000, description: "Premium Table" }
];

export default function LandingPage({
  onGuest,
  onSignIn,
  onSignUp
}: LandingPageProps) {
  return (
    <main className="landing-page dashboard-page">
      <div className="landing-glow landing-glow-one" />
      <div className="landing-glow landing-glow-two" />

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div className="dashboard-brand">
            <div className="brand-symbol">R</div>
            <div>
              <h1>RUMMY</h1>
              <span>13 CARD RUMMY</span>
            </div>
          </div>

          <div className="dashboard-wallet">
            <span>COINS</span>
            <strong>2,000</strong>
          </div>
        </header>

        <section className="dashboard-welcome">
          <div>
            <span className="dashboard-eyebrow">WELCOME</span>
            <h2>Ready to play?</h2>
            <p>Choose your table and start playing.</p>
          </div>

          <button
            type="button"
            className="dashboard-account-button"
            onClick={onSignIn}
          >
            SIGN IN
          </button>
        </section>

        <section className="dashboard-rooms">
          <div className="dashboard-section-heading">
            <span />
            <h3>CHOOSE ROOM</h3>
            <span />
          </div>

          <p className="dashboard-section-subtitle">
            Select a table to start your game
          </p>

          <div className="dashboard-room-grid">
            {rooms.map(room => (
              <article
                className="dashboard-room-card"
                key={room.name}
              >
                <div className="dashboard-room-top">
                  <span>{room.name}</span>
                  <small>TABLE</small>
                </div>

                <div className="dashboard-entry">
                  <small>ENTRY</small>
                  <strong>{room.entryFee.toLocaleString()}</strong>
                  <span>COINS</span>
                </div>

                <p>{room.description}</p>

                <button
                  type="button"
                  disabled={room.entryFee > 2000}
                  onClick={onGuest}
                >
                  {room.entryFee > 2000 ? "LOCKED" : "PLAY"}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-auth">
          <span>Already have an account?</span>
          <button type="button" onClick={onSignIn}>
            SIGN IN
          </button>
          <span className="dashboard-auth-divider">•</span>
          <button type="button" onClick={onSignUp}>
            CREATE ACCOUNT
          </button>
        </section>

        <nav className="dashboard-nav">
          <button type="button" className="dashboard-nav-active">
            <span>HOME</span>
            <small>HOME</small>
          </button>

          <button type="button" onClick={onGuest}>
            <span>GAME</span>
            <small>PLAY</small>
          </button>

          <button type="button" onClick={onSignIn}>
            <span>COINS</span>
            <small>WALLET</small>
          </button>

          <button type="button" onClick={onSignIn}>
            <span>USER</span>
            <small>PROFILE</small>
          </button>
        </nav>

        <footer className="dashboard-footer">
          PLAY • ENJOY • REPEAT
        </footer>
      </section>
    </main>
  );
}
