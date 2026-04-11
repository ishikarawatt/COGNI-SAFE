import sqlite3
import numpy as np
import os
import json
from datetime import datetime

# ── Database path ────────────────────────────────────────────────────────────
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'sessions.db')

# ── All 14 biomarker names ────────────────────────────────────────────────────
BIOMARKERS = [
    'speech_rate', 'articulation_rate', 'pause_frequency',
    'pause_duration_mean', 'filled_pause_rate', 'pitch_mean',
    'pitch_range', 'jitter', 'shimmer', 'HNR',
    'lexical_diversity', 'semantic_coherence',
    'idea_density', 'syntactic_complexity'
]


# ── Database Setup ────────────────────────────────────────────────────────────
def init_db():
    """Create the SQLite database and sessions table if they don't exist."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id       TEXT    NOT NULL,
            timestamp     TEXT    NOT NULL,
            biomarkers    TEXT    NOT NULL,
            risk_tier     TEXT    NOT NULL,
            anomaly_flags TEXT    NOT NULL
        )
    ''')

    conn.commit()
    conn.close()
    print("[DB] Database initialized ✅")


# ── Save a session ────────────────────────────────────────────────────────────
def save_session(user_id: str, biomarkers: dict, risk_tier: str, anomaly_flags: list):
    """Save a completed session to SQLite."""
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO sessions (user_id, timestamp, biomarkers, risk_tier, anomaly_flags)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        user_id,
        datetime.utcnow().isoformat(),
        json.dumps(biomarkers),
        risk_tier,
        json.dumps(anomaly_flags)
    ))

    conn.commit()
    conn.close()
    print(f"[DB] Session saved for user {user_id} ✅")


# ── Load past sessions ────────────────────────────────────────────────────────
def load_sessions(user_id: str) -> list:
    """Load all past sessions for a user from SQLite."""
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        SELECT biomarkers, timestamp FROM sessions
        WHERE user_id = ?
        ORDER BY timestamp ASC
    ''', (user_id,))

    rows = cursor.fetchall()
    conn.close()

    sessions = []
    for row in rows:
        biomarkers = json.loads(row[0])
        timestamp  = row[1]
        sessions.append({'biomarkers': biomarkers, 'timestamp': timestamp})

    return sessions


# ── Anomaly Detection ─────────────────────────────────────────────────────────
def detect_anomalies(user_id: str, current_biomarkers: dict) -> list:
    """
    Compare current session biomarkers against user's historical baseline.
    Returns a list of anomaly flags with severity levels.

    Severity:
    - mild     = 2.0 - 2.5 sigma deviation
    - moderate = 2.5 - 3.0 sigma deviation
    - severe   = 3.0+ sigma deviation
    """
    past_sessions = load_sessions(user_id)

    # Need at least 3 sessions to establish a baseline
    if len(past_sessions) < 3:
        print(f"[Anomaly] Only {len(past_sessions)} sessions found — need 3+ for baseline")
        return []

    anomaly_flags = []

    for biomarker in BIOMARKERS:
        # Collect historical values for this biomarker
        historical_values = []
        for session in past_sessions:
            val = session['biomarkers'].get(biomarker)
            if val is not None and val != 0.0:
                historical_values.append(float(val))

        if len(historical_values) < 3:
            continue

        mean   = np.mean(historical_values)
        std    = np.std(historical_values)
        current = current_biomarkers.get(biomarker, 0.0)

        # Avoid division by zero
        if std == 0:
            continue

        deviation = abs(current - mean) / std

        if deviation >= 2.0:
            if deviation >= 3.0:
                severity = 'severe'
            elif deviation >= 2.5:
                severity = 'moderate'
            else:
                severity = 'mild'

            anomaly_flags.append({
                'biomarker': biomarker,
                'severity':  severity,
                'current':   round(current, 4),
                'baseline':  round(mean, 4),
                'deviation': round(deviation, 2),
            })

            print(f"[Anomaly] ⚠️  {biomarker}: {severity} deviation ({deviation:.2f} sigma)")

    return anomaly_flags


# ── Risk Tier Scoring ─────────────────────────────────────────────────────────
def compute_risk_tier(anomaly_flags: list) -> str:
    """
    Aggregate anomaly flags into a single risk tier.

    Rules:
    - Green  : No anomalies
    - Yellow : 2+ mild flags  OR  1 moderate flag
    - Orange : 2+ moderate flags  OR  1 severe flag
    - Red    : 2+ severe flags  OR  3+ moderate flags
    """
    if not anomaly_flags:
        return 'Green'

    mild_count     = sum(1 for f in anomaly_flags if f['severity'] == 'mild')
    moderate_count = sum(1 for f in anomaly_flags if f['severity'] == 'moderate')
    severe_count   = sum(1 for f in anomaly_flags if f['severity'] == 'severe')

    if severe_count >= 2 or moderate_count >= 3:
        return 'Red'
    elif moderate_count >= 2 or severe_count >= 1:
        return 'Orange'
    elif mild_count >= 2 or moderate_count >= 1:
        return 'Yellow'
    else:
        return 'Green'


# ── Confidence Intervals ──────────────────────────────────────────────────────
def compute_confidence_intervals(user_id: str) -> dict:
    """
    Compute 95% confidence intervals for each biomarker
    based on user's historical data.
    """
    past_sessions = load_sessions(user_id)

    if len(past_sessions) < 3:
        return {}

    intervals = {}
    for biomarker in BIOMARKERS:
        values = [
            float(s['biomarkers'][biomarker])
            for s in past_sessions
            if biomarker in s['biomarkers'] and s['biomarkers'][biomarker] != 0.0
        ]

        if len(values) < 3:
            continue

        mean = np.mean(values)
        std  = np.std(values)

        intervals[biomarker] = {
            'mean':       round(mean, 4),
            'std':        round(std, 4),
            'lower_95':   round(mean - 1.96 * std, 4),
            'upper_95':   round(mean + 1.96 * std, 4),
        }

    return intervals


# ── Full Anomaly Pipeline ─────────────────────────────────────────────────────
def run_anomaly_pipeline(user_id: str, current_biomarkers: dict) -> dict:
    """
    Main entry point:
    1. Detect anomalies vs historical baseline
    2. Compute risk tier
    3. Save session to DB
    4. Return flags + tier + confidence intervals
    """
    anomaly_flags = detect_anomalies(user_id, current_biomarkers)
    risk_tier     = compute_risk_tier(anomaly_flags)
    confidence    = compute_confidence_intervals(user_id)

    # Save current session AFTER anomaly detection
    save_session(user_id, current_biomarkers, risk_tier, anomaly_flags)

    return {
        'anomaly_flags':        anomaly_flags,
        'risk_tier':            risk_tier,
        'confidence_intervals': confidence,
    }