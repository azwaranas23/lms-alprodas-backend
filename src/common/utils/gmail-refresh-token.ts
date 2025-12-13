import { google } from 'googleapis';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  // Step 1: Generate URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://mail.google.com/'],
    prompt: 'consent',
  });

  console.log('\nAuthorize this URL in your browser:\n');
  console.log(authUrl);

  console.log('\nSet the CODE you get here and run the script again:\n');
  console.log(`node dist/scripts/gmail-refresh-token.js --code=YOUR_CODE`);
}

main();
