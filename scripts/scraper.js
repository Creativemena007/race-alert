const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'dev-secret';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SPECIFIC_RACE_ID = process.env.SPECIFIC_RACE_ID;

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');

async function ensureLogsDir() {
  try {
    await fs.mkdir(logsDir, { recursive: true });
  } catch (error) {
    console.warn('Could not create logs directory:', error.message);
  }
}

async function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${level}: ${message}`;
  
  console.log(logMessage);
  
  try {
    const logFile = path.join(logsDir, `scraper-${new Date().toISOString().split('T')[0]}.log`);
    await fs.appendFile(logFile, logMessage + '\\n');
  } catch (error) {
    console.warn('Could not write to log file:', error.message);
  }
}

// Supabase client for fetching races
async function createSupabaseClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// Fetch races to scrape
async function fetchRaces() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    await log('Missing Supabase configuration, using fallback races', 'WARN');
    return getFallbackRaces();
  }

  try {
    const supabase = await createSupabaseClient();
    
    let query = supabase.from('races').select('*');
    
    if (SPECIFIC_RACE_ID) {
      query = query.eq('id', SPECIFIC_RACE_ID);
    }
    
    const { data: races, error } = await query;
    
    if (error) {
      await log(`Supabase error: ${error.message}`, 'ERROR');
      return getFallbackRaces();
    }
    
    await log(`Fetched ${races.length} races from database`);
    return races;
  } catch (error) {
    await log(`Failed to fetch races: ${error.message}`, 'ERROR');
    return getFallbackRaces();
  }
}

// Fallback races for development/testing
function getFallbackRaces() {
  return [
    {
      id: '1',
      name: 'Boston Marathon',
      url: 'https://www.baa.org/races/boston-marathon/enter/registration',
      open_keywords: ['registration is open', 'register now', 'apply now'],
      closed_keywords: ['registration closed', 'registration has closed']
    },
    {
      id: '2', 
      name: 'TCS London Marathon',
      url: 'https://www.londonmarathonevents.co.uk/london-marathon/enter-ballot',
      open_keywords: ['ballot is open', 'enter ballot'],
      closed_keywords: ['ballot closed', 'ballot has closed']
    }
  ];
}

// Scrape a single race
async function scrapeRace(race, browser) {
  await log(`Scraping ${race.name}: ${race.url}`);
  
  let page;
  try {
    page = await browser.newPage();
    
    // Set reasonable timeout and user agent
    await page.setDefaultTimeout(30000);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Navigate to the race page
    await page.goto(race.url, { waitUntil: 'domcontentloaded' });
    
    // Wait a bit for dynamic content
    await page.waitForTimeout(2000);
    
    // Get page text content
    const pageText = await page.textContent('body');
    const lowercaseText = pageText.toLowerCase();
    
    // Check for keywords
    const openKeywords = race.open_keywords || [];
    const closedKeywords = race.closed_keywords || [];
    
    const hasOpenKeywords = openKeywords.some(keyword => 
      lowercaseText.includes(keyword.toLowerCase())
    );
    
    const hasClosedKeywords = closedKeywords.some(keyword => 
      lowercaseText.includes(keyword.toLowerCase())
    );
    
    // Determine status
    let status = 'unknown';
    if (hasOpenKeywords && !hasClosedKeywords) {
      status = 'open';
    } else if (hasClosedKeywords) {
      status = 'closed';
    }
    
    await log(`${race.name} status: ${status} (open keywords: ${hasOpenKeywords}, closed keywords: ${hasClosedKeywords})`);
    
    return {
      race_id: race.id,
      status,
      scraped_at: new Date().toISOString(),
      content_snippet: lowercaseText.substring(0, 500)
    };
    
  } catch (error) {
    await log(`Error scraping ${race.name}: ${error.message}`, 'ERROR');
    return {
      race_id: race.id,
      status: 'unknown',
      scraped_at: new Date().toISOString(),
      error: error.message
    };
  } finally {
    if (page) {
      await page.close();
    }
  }
}

// Send webhook notification
async function sendWebhook(result) {
  if (!WEBHOOK_URL) {
    await log('No webhook URL configured, skipping notification', 'WARN');
    return;
  }
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEBHOOK_SECRET}`
      },
      body: JSON.stringify(result)
    });
    
    if (response.ok) {
      const data = await response.json();
      await log(`Webhook sent successfully for race ${result.race_id}. Notifications: ${data.notifications_sent || 0}`);
    } else {
      await log(`Webhook failed with status ${response.status}: ${await response.text()}`, 'ERROR');
    }
  } catch (error) {
    await log(`Webhook error: ${error.message}`, 'ERROR');
  }
}

// Main scraper function
async function main() {
  await ensureLogsDir();
  await log('Starting race registration scraper');
  
  let browser;
  try {
    // Fetch races to scrape
    const races = await fetchRaces();
    
    if (races.length === 0) {
      await log('No races to scrape', 'WARN');
      return;
    }
    
    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Process each race
    const results = [];
    for (const race of races) {
      const result = await scrapeRace(race, browser);
      results.push(result);
      
      // Send webhook if status indicates potential change
      if (result.status === 'open') {
        await sendWebhook(result);
      }
      
      // Small delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    await log(`Scraping completed. Processed ${results.length} races`);
    
    // Log summary
    const statusSummary = results.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    
    await log(`Status summary: ${JSON.stringify(statusSummary)}`);
    
  } catch (error) {
    await log(`Fatal error: ${error.message}`, 'ERROR');
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  await log('Scraper finished');
}

// Handle uncaught errors
process.on('unhandledRejection', async (reason, promise) => {
  await log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'ERROR');
  process.exit(1);
});

process.on('uncaughtException', async (error) => {
  await log(`Uncaught Exception: ${error.message}`, 'ERROR');
  process.exit(1);
});

// Run the scraper
if (require.main === module) {
  main();
}