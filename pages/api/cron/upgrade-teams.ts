import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Security: Verify this is a legitimate cron request
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Call our internal upgrade API
    const upgradeResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/internal/upgrade-teams`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        force: false, // Don't force upgrade teams that are already upgraded
        dryRun: false, // Set to true if you want to test first
      }),
    });

    if (!upgradeResponse.ok) {
      throw new Error(`Upgrade API returned ${upgradeResponse.status}`);
    }

    const result = await upgradeResponse.json();

    console.log('🎉 Automatic team upgrade cron completed:', result.summary);

    return res.status(200).json({
      success: true,
      message: 'Team upgrades processed successfully',
      timestamp: new Date().toISOString(),
      summary: result.summary,
    });

  } catch (error) {
    console.error('💥 Cron upgrade failed:', error);

    return res.status(500).json({
      success: false,
      error: 'Cron job failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}