const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const originalServerCode = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');

const tiers = [
    { name: 'Basic', cap: 10000, exeName: 'LeadFinder-Basic.exe' },
    { name: 'Standard', cap: 20000, exeName: 'LeadFinder-Standard.exe' },
    { name: 'Premium', cap: 40000, exeName: 'LeadFinder-Premium.exe' }
];

console.log('Starting standalone Windows .exe build process for 3 pricing tiers...');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

for (const tier of tiers) {
    console.log(`\n==================================================`);
    console.log(` Building Tier: ${tier.name} (Daily Cap: ${tier.cap.toLocaleString()} leads/day)`);
    console.log(`==================================================`);

    // Create tier-specific temporary server entry file with hardcoded cap
    const tierServerCode = originalServerCode.replace(
        /const DAILY_CAP = parseInt\(process\.env\.DAILY_CAP \|\| '\d+', 10\);/,
        `const DAILY_CAP = ${tier.cap};`
    );

    const tempServerFile = path.join(__dirname, `temp_server_${tier.name.toLowerCase()}.js`);
    fs.writeFileSync(tempServerFile, tierServerCode, 'utf8');

    // Create tier directory
    const tierDir = path.join(distDir, tier.name);
    if (!fs.existsSync(tierDir)) {
        fs.mkdirSync(tierDir, { recursive: true });
    }

    const exePath = path.join(tierDir, tier.exeName);

    // Build standalone executable with pkg, explicitly including package.json asset config
    const pkgCmd = `npx pkg "${tempServerFile}" --config package.json --targets node18-win-x64 --output "${exePath}"`;
    console.log(`Running build command: ${pkgCmd}`);
    execSync(pkgCmd, { stdio: 'inherit' });

    // Clean up temporary server entry file
    if (fs.existsSync(tempServerFile)) {
        fs.unlinkSync(tempServerFile);
    }

    // Write README.txt inside tier folder
    const readmeContent = `=====================================================
LEAD FINDER PRO - ${tier.name.toUpperCase()} EDITION
Daily Lead Scraping Limit: ${tier.cap.toLocaleString()} leads / 24 Hours
=====================================================

HOW TO RUN:
1. Double-click "${tier.exeName}".
2. Your default web browser will open automatically to http://localhost:3000.
3. Define your target niche (e.g., Cafes, Plumbers, Dentists) and select your target US States or Canadian Provinces.
4. Click "Start Search" to begin extracting verified business leads!

NOTES:
- No installation, Node.js, or terminal setup required.
- All scraped lead records are automatically saved to "scraped_leads.json" in this directory.
- Click "Export Excel" in the dashboard at any time to download your leads as a .xlsx spreadsheet.
- Daily scraping limit resets automatically every 24 hours.

Support & Inquiries: jaatpunit21@gmail.com
`;

    fs.writeFileSync(path.join(tierDir, 'README.txt'), readmeContent, 'utf8');

    // Create ZIP archive for tier
    console.log(`Packaging ${tier.name} edition into ZIP...`);
    const zipPath = path.join(distDir, `LeadFinder-${tier.name}.zip`);
    
    try {
        const powershellZip = `Compress-Archive -Path '${tierDir}\\*' -DestinationPath '${zipPath}' -Force`;
        execSync(`powershell -Command "${powershellZip}"`, { stdio: 'inherit' });
        console.log(`SUCCESS: Created ${zipPath}`);
    } catch (e) {
        console.error(`Error zipping ${tier.name}:`, e.message);
    }
}

console.log('\n✅ All 3 standalone executable packages built successfully in dist/ folder!');
