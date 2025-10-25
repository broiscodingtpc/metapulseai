// Test endpoint for API functionality
import { NextRequest, NextResponse } from 'next/server';
import { dexscreenerAPI } from '../../lib/api/dexscreener';
import { pumpPortalAPI } from '../../lib/api/pumpportal';
import { groqAPI } from '../../lib/api/groq';
import { telegramAPI } from '../../lib/api/telegram';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const test = searchParams.get('test');

  try {
    switch (test) {
      case 'dexscreener':
        const boosts = await dexscreenerAPI.getLatestBoosts();
        return NextResponse.json({
          success: true,
          service: 'Dexscreener',
          data: boosts.slice(0, 3) // Return first 3 for testing
        });

      case 'pumpportal':
        const tokens = await pumpPortalAPI.getRecentTokens(1, 5);
        return NextResponse.json({
          success: true,
          service: 'PumpPortal',
          data: tokens
        });

      case 'groq':
        const analysis = await groqAPI.analyzeToken({
          name: 'Test Token',
          symbol: 'TEST',
          description: 'A test token for AI analysis',
          marketCap: 100000,
          volume24h: 50000,
          priceChange24h: 5.5,
          age: 2
        });
        return NextResponse.json({
          success: true,
          service: 'Groq AI',
          data: analysis
        });

      case 'telegram':
        await telegramAPI.sendSystemMessage('🧪 API Test Message\n\nAll systems operational!');
        return NextResponse.json({
          success: true,
          service: 'Telegram',
          message: 'Test message sent'
        });

      case 'all':
        // Test all APIs
        const results: any = {
          dexscreener: { status: 'pending' },
          pumpportal: { status: 'pending' },
          groq: { status: 'pending' },
          telegram: { status: 'pending' }
        };

        // Test Dexscreener
        try {
          const dexBoosts = await dexscreenerAPI.getLatestBoosts();
          results.dexscreener = { 
            status: 'success', 
            count: dexBoosts.length 
          };
        } catch (error) {
          results.dexscreener = { 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }

        // Test PumpPortal
        try {
          const pumpTokens = await pumpPortalAPI.getRecentTokens(1, 3);
          results.pumpportal = { 
            status: 'success', 
            count: pumpTokens.length 
          };
        } catch (error) {
          results.pumpportal = { 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }

        // Test Groq
        try {
          const groqAnalysis = await groqAPI.analyzeToken({
            name: 'Test Token',
            symbol: 'TEST',
            description: 'AI test token',
            marketCap: 50000
          });
          results.groq = { 
            status: 'success', 
            score: groqAnalysis.score 
          };
        } catch (error) {
          results.groq = { 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }

        // Test Telegram
        try {
          await telegramAPI.sendSystemMessage('🔧 Full API Test Complete\n\nAll services tested successfully!');
          results.telegram = { status: 'success' };
        } catch (error) {
          results.telegram = { 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }

        return NextResponse.json({
          success: true,
          service: 'All APIs',
          results
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid test parameter',
          available: ['dexscreener', 'pumpportal', 'groq', 'telegram', 'all']
        }, { status: 400 });
    }
  } catch (error) {
    console.error(`[API Test] Error testing ${test}:`, error);
    return NextResponse.json({
      success: false,
      service: test,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}