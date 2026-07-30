import { query } from './db';

/**
 * Presence tracking: `users.last_seen` for "last seen 32 mins ago" and
 * `user_active_days` for the consecutive-days streak.
 */

// How stale last_seen has to be before we write again. /api/auth/me runs on
// every navigation, so without this we'd hammer the users table.
const TOUCH_THROTTLE = '1 minute';

/**
 * Record that the user is here right now. Cheap and idempotent: the day row is
 * only written when last_seen was actually refreshed. Never throws — presence
 * is not worth failing a request over.
 */
export async function touchUserActivity(userId: number): Promise<void> {
  try {
    const touched = await query(
      `UPDATE users
       SET last_seen = NOW()
       WHERE id = $1
         AND (last_seen IS NULL OR last_seen < NOW() - INTERVAL '${TOUCH_THROTTLE}')
       RETURNING id`,
      [userId]
    );

    if (touched.rowCount === 0) return;

    await recordActiveDay(userId);
  } catch (error) {
    console.error('Error recording user activity:', error);
  }
}

/**
 * Mark a fresh login: moves both timestamps and counts today towards the
 * streak, whatever the throttle would have said.
 */
export async function recordLogin(userId: number): Promise<void> {
  await query(
    `UPDATE users SET last_login = NOW(), last_seen = NOW() WHERE id = $1`,
    [userId]
  );
  await recordActiveDay(userId);
}

async function recordActiveDay(userId: number): Promise<void> {
  await query(
    `INSERT INTO user_active_days (user_id, day)
     VALUES ($1, CURRENT_DATE)
     ON CONFLICT DO NOTHING`,
    [userId]
  );
}

/**
 * A CTE naming `streaks(user_id, streak)`. Prepend it to a users query and
 * LEFT JOIN it — see the callers in /api/users/search and /api/admin/users/get.
 *
 * The trick: ordering a user's days newest-first and adding the row number back
 * onto the date gives every day in a consecutive run the same key. Keep the run
 * whose key matches the most recent day, as long as that day is today or
 * yesterday — otherwise the streak is broken and counts as 0.
 */
export const STREAKS_CTE = `
  streaks AS (
    SELECT d.user_id, COUNT(*)::int AS streak
    FROM (
      SELECT
        user_id,
        day + (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day DESC))::int AS run_key,
        MAX(day) OVER (PARTITION BY user_id) AS last_day
      FROM user_active_days
    ) d
    WHERE d.last_day >= CURRENT_DATE - 1
      AND d.run_key = d.last_day + 1
    GROUP BY d.user_id
  )
`;

/** Current streak, in days, for a single user. 0 when it has lapsed. */
export async function getUserStreak(userId: number): Promise<number> {
  try {
    const result = await query(
      `WITH ${STREAKS_CTE}
       SELECT streak FROM streaks WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0]?.streak ?? 0;
  } catch (error) {
    console.error('Error computing user streak:', error);
    return 0;
  }
}
