import { NextApiRequest, NextApiResponse } from "next";

import { DATAROOMS_PLUS_PLAN_LIMITS } from "@/ee/limits/constants";
import prisma from "@/lib/prisma";
import { log } from "@/lib/utils";

// ========================================
// CONFIGURATION: Teams that should always be on Data Rooms Plus
// ========================================
const TEAMS_TO_UPGRADE = [
  "cmfyednyw0000kv04ko2k2xd2",

  // Add more team IDs here as needed
];

// ========================================
// API ENDPOINT FOR AUTOMATIC TEAM UPGRADES
// ========================================

interface UpgradeResult {
  teamId: string;
  success: boolean;
  message: string;
  previousPlan?: string;
  newPlan?: string;
}

async function upgradeTeamToDataRoomsPlus(teamId: string, force: boolean = false): Promise<UpgradeResult> {
  try {
    // Check if team exists and get current plan
    const existingTeam = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, plan: true, limits: true }
    });

    if (!existingTeam) {
      return {
        teamId,
        success: false,
        message: `Team not found`
      };
    }

    // Check if already on datarooms-plus
    if (existingTeam.plan === 'datarooms-plus' && !force) {
      return {
        teamId,
        success: true,
        message: `Team "${existingTeam.name}" is already on Data Rooms Plus`,
        previousPlan: existingTeam.plan,
        newPlan: 'datarooms-plus'
      };
    }

    // Perform the upgrade
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        plan: 'datarooms-plus',
        limits: DATAROOMS_PLUS_PLAN_LIMITS,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        updatedAt: new Date(),
      },
    });

    // Log the upgrade
    await log({
      message: `Team "${existingTeam.name}" (${teamId}) automatically upgraded to Data Rooms Plus via API`,
      type: "info"
    });

    return {
      teamId,
      success: true,
      message: `Successfully upgraded team "${existingTeam.name}" to Data Rooms Plus`,
      previousPlan: existingTeam.plan,
      newPlan: 'datarooms-plus'
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await log({
      message: `Failed to auto-upgrade team ${teamId}: ${errorMessage}`,
      type: "error"
    });

    return {
      teamId,
      success: false,
      message: `Error: ${errorMessage}`
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Security: Check authentication
  const authToken = req.headers.authorization?.replace('Bearer ', '');
  const expectedToken = process.env.INTERNAL_API_SECRET;

  if (!expectedToken || authToken !== expectedToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid INTERNAL_API_SECRET required'
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    });
  }

  try {
    const { force = false, dryRun = false } = req.body;

    console.log(`🚀 Starting automatic team upgrades (${dryRun ? 'DRY RUN' : 'LIVE'})`);

    if (TEAMS_TO_UPGRADE.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No teams configured for upgrade',
        results: []
      });
    }

    const results: UpgradeResult[] = [];

    // Process each team
    for (const teamId of TEAMS_TO_UPGRADE) {
      if (dryRun) {
        // For dry run, just check what would happen
        const existingTeam = await prisma.team.findUnique({
          where: { id: teamId },
          select: { id: true, name: true, plan: true }
        });

        if (!existingTeam) {
          results.push({
            teamId,
            success: false,
            message: `Team not found`
          });
        } else {
          results.push({
            teamId,
            success: true,
            message: `[DRY RUN] Would upgrade team "${existingTeam.name}" from "${existingTeam.plan}" to "datarooms-plus"`,
            previousPlan: existingTeam.plan,
            newPlan: 'datarooms-plus'
          });
        }
      } else {
        // Actual upgrade
        const result = await upgradeTeamToDataRoomsPlus(teamId, force);
        results.push(result);
      }

      // Small delay between upgrades
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    const response = {
      success: true,
      dryRun,
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
      },
      results: results,
    };

    console.log(`✅ Upgrade complete: ${successful.length}/${results.length} successful`);

    return res.status(200).json(response);

  } catch (error) {
    console.error('💥 Upgrade API error:', error);

    await log({
      message: `Automatic team upgrade API failed: ${error}`,
      type: "error"
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}