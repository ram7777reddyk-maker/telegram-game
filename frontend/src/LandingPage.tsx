import "./LandingPage.css";

interface LandingPageProps {
  onGuest: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}

export default function LandingPage({
  onGuest,
  onSignIn,
  onSignUp
}: LandingPageProps) {
  return (
    <main className="landing-page">
      <div className="landing-glow landing-glow-one" />
      <div className="landing-glow landing-glow-two" />

      <section className="landing-content">
        <div className="landing-brand">
          <div className="brand-symbol">
            ?
          </div>

          <h1>RUMMY</h1>

          <p className="brand-tagline">
            13 CARD RUMMY
          </p>
        </div>

        <div className="landing-card">
          <div className="landing-card-top">
            <span>WELCOME</span>
            <span className="landing-dot">?</span>
          </div>

          <h2>Ready to play?</h2>

          <p className="landing-description">
            Join a table, arrange your cards and
            enjoy the game.
          </p>

          <button
            type="button"
            className="landing-primary-button"
            onClick={onGuest}
          >
            <span>PLAY AS GUEST</span>
            <span className="button-arrow">?</span>
          </button>

          <button
            type="button"
            className="landing-secondary-button"
            onClick={onSignIn}
          >
            SIGN IN
          </button>

          <div className="landing-signup">
            <span>New here?</span>

            <button
              type="button"
              onClick={onSignUp}
            >
              CREATE ACCOUNT
            </button>
          </div>
        </div>

        <div className="landing-footer">
          <span>?</span>
          <span>PLAY • ENJOY • REPEAT</span>
          <span>?</span>
        </div>
      </section>
    </main>
  );
}
