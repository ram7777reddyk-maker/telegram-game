-- ============================================================
-- PHASE 2: AUTHENTICATION + WALLET
-- ============================================================

-- Existing Telegram users table:
-- Telegram ID must become optional because mobile users
-- will not have a Telegram ID.

ALTER TABLE users
ALTER COLUMN telegram_id DROP NOT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS auth_type VARCHAR(20) NOT NULL DEFAULT 'mobile';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
ADD CONSTRAINT users_auth_type_check
CHECK (auth_type IN ('mobile', 'telegram'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_mobile
ON users (mobile)
WHERE mobile IS NOT NULL;


-- ============================================================
-- OTP VERIFICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS otp_verifications (
    id BIGSERIAL PRIMARY KEY,
    mobile VARCHAR(20) NOT NULL,
    otp_hash TEXT NOT NULL,
    purpose VARCHAR(30) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT otp_purpose_check
    CHECK (
        purpose IN (
            'signup',
            'forgot_password',
            'login'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_otp_mobile
ON otp_verifications (mobile);

CREATE INDEX IF NOT EXISTS idx_otp_expires_at
ON otp_verifications (expires_at);


-- ============================================================
-- WALLET
-- ============================================================

CREATE TABLE IF NOT EXISTS wallets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    balance BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT wallets_user_fk
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    CONSTRAINT wallets_balance_check
    CHECK (balance >= 0)
);


-- ============================================================
-- WALLET LEDGER
-- Never directly trust frontend balance changes.
-- Every coin movement gets a transaction record.
-- ============================================================

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL,
    amount BIGINT NOT NULL,
    balance_before BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    transaction_type VARCHAR(30) NOT NULL,
    reference_id VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT wallet_transactions_wallet_fk
    FOREIGN KEY (wallet_id)
    REFERENCES wallets(id)
    ON DELETE CASCADE,

    CONSTRAINT wallet_transaction_type_check
    CHECK (
        transaction_type IN (
            'signup_bonus',
            'room_entry',
            'game_win',
            'game_refund',
            'admin_adjustment'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet
ON wallet_transactions (wallet_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference
ON wallet_transactions (reference_id);


-- ============================================================
-- ROOM LIMITS
-- ============================================================

ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS entry_fee BIGINT NOT NULL DEFAULT 500;

ALTER TABLE rooms
ADD CONSTRAINT rooms_entry_fee_check
CHECK (entry_fee IN (500, 1000, 2000, 5000));


-- ============================================================
-- COMPLETE
-- ============================================================

