import { useState } from "react";

interface AuthPanelProps {
  mode: "signin" | "signup";
  onBack: () => void;
  onAuthenticated: (
    token: string,
    name: string,
    mobile: string
  ) => void;
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

export default function AuthPanel({
  mode,
  onBack,
  onAuthenticated
}: AuthPanelProps) {
  const [currentMode, setCurrentMode] =
    useState<"signin" | "signup">(mode);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [signupStep, setSignupStep] =
    useState<"details" | "otp">("details");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  async function request(
    endpoint: string,
    body: Record<string, string>
  ) {
    const response = await fetch(
      `${API_URL}${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Request failed"
      );
    }

    return data;
  }

  async function handleLogin(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!mobile.trim() || !password) {
      setError(
        "Enter your mobile number and password."
      );
      return;
    }

    try {
      setLoading(true);

      const data = await request(
        "/auth/login",
        {
          mobile: mobile.trim(),
          password
        }
      );

      localStorage.setItem(
        "rummy_auth_token",
        data.token
      );

      localStorage.setItem(
        "rummy_user",
        JSON.stringify(data.user)
      );

      onAuthenticated(
        data.token,
        data.user.name,
        data.user.mobile
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSignupDetails(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !name.trim() ||
      !mobile.trim() ||
      !password
    ) {
      setError(
        "Enter your name, mobile number and password."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const data = await request(
        "/auth/signup",
        {
          name: name.trim(),
          mobile: mobile.trim(),
          password
        }
      );

      setSignupStep("otp");

      setMessage(
        data.message ||
        "OTP sent successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create account"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!otp.trim()) {
      setError("Enter the OTP.");
      return;
    }

    try {
      setLoading(true);

      const data = await request(
        "/auth/verify-otp",
        {
          mobile: mobile.trim(),
          otp: otp.trim()
        }
      );

      if (data.token) {
        localStorage.setItem(
          "rummy_auth_token",
          data.token
        );
      }

      localStorage.setItem(
        "rummy_user",
        JSON.stringify(data.user)
      );

      onAuthenticated(
        data.token || "",
        data.user.name,
        data.user.mobile
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "OTP verification failed"
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode(
    nextMode: "signin" | "signup"
  ) {
    setCurrentMode(nextMode);
    setSignupStep("details");
    setError("");
    setMessage("");
    setOtp("");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">

        <button
          type="button"
          className="auth-back"
          onClick={onBack}
        >
          ? Back
        </button>

        <div className="auth-brand">
          <div className="auth-symbol">
            R
          </div>

          <h1>RUMMY</h1>

          <p>13 CARD RUMMY</p>
        </div>

        {currentMode === "signin" && (
          <>
            <h2>Welcome Back</h2>

            <p className="auth-description">
              Sign in to continue playing.
            </p>

            <form
              onSubmit={handleLogin}
              className="auth-form"
            >
              <label>
                Mobile Number

                <input
                  type="tel"
                  value={mobile}
                  onChange={event =>
                    setMobile(
                      event.target.value
                    )
                  }
                  placeholder="+91XXXXXXXXXX"
                  autoComplete="tel"
                />
              </label>

              <label>
                Password

                <input
                  type="password"
                  value={password}
                  onChange={event =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </label>

              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="auth-primary-button"
                disabled={loading}
              >
                {loading
                  ? "SIGNING IN..."
                  : "SIGN IN"}
              </button>
            </form>

            <div className="auth-switch">
              <span>
                New here?
              </span>

              <button
                type="button"
                onClick={() =>
                  switchMode("signup")
                }
              >
                CREATE ACCOUNT
              </button>
            </div>
          </>
        )}

        {currentMode === "signup" &&
          signupStep === "details" && (
            <>
              <h2>Create Account</h2>

              <p className="auth-description">
                Create your account and receive
                virtual coins after verification.
              </p>

              <form
                onSubmit={
                  handleSignupDetails
                }
                className="auth-form"
              >
                <label>
                  Name

                  <input
                    type="text"
                    value={name}
                    onChange={event =>
                      setName(
                        event.target.value
                      )
                    }
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </label>

                <label>
                  Mobile Number

                  <input
                    type="tel"
                    value={mobile}
                    onChange={event =>
                      setMobile(
                        event.target.value
                      )
                    }
                    placeholder="+91XXXXXXXXXX"
                    autoComplete="tel"
                  />
                </label>

                <label>
                  Password

                  <input
                    type="password"
                    value={password}
                    onChange={event =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                  />
                </label>

                {error && (
                  <div className="auth-error">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "CREATING..."
                    : "CONTINUE"}
                </button>
              </form>

              <div className="auth-switch">
                <span>
                  Already have an account?
                </span>

                <button
                  type="button"
                  onClick={() =>
                    switchMode("signin")
                  }
                >
                  SIGN IN
                </button>
              </div>
            </>
          )}

        {currentMode === "signup" &&
          signupStep === "otp" && (
            <>
              <h2>Verify Mobile</h2>

              <p className="auth-description">
                Enter the 6-digit OTP sent to
                <strong>
                  {" "}{mobile}
                </strong>
              </p>

              {message && (
                <div className="auth-message">
                  {message}
                </div>
              )}

              <form
                onSubmit={handleVerifyOtp}
                className="auth-form"
              >
                <label>
                  Verification OTP

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={event =>
                      setOtp(
                        event.target.value
                          .replace(/\D/g, "")
                      )
                    }
                    placeholder="6-digit OTP"
                    autoComplete="one-time-code"
                  />
                </label>

                {error && (
                  <div className="auth-error">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={
                    loading ||
                    otp.length !== 6
                  }
                >
                  {loading
                    ? "VERIFYING..."
                    : "VERIFY & PLAY"}
                </button>
              </form>

              <button
                type="button"
                className="auth-secondary-button"
                onClick={() => {
                  setSignupStep("details");
                  setOtp("");
                  setError("");
                  setMessage("");
                }}
              >
                CHANGE DETAILS
              </button>
            </>
          )}

      </section>
    </main>
  );
}
