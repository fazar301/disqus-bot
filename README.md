# Disqus Vote Bot

A web application that allows you to upvote and downvote Disqus comments using multiple Disqus accounts. The bot automatically shuffles between different accounts to avoid detection and rate limiting.

## Features

- Upvote and downvote Disqus comments
- Multiple account support
- Automatic account shuffling
- Rate limiting protection
- Simple web interface
- Real-time status updates

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- A modern web browser

## Installation

1. Clone the repository:
```bash
git clone https://github.com/fazar301/disqus-bot.git
cd disqus-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `credentials.json` file in the root directory with your Disqus account credentials.

## Setting Up Disqus Accounts

### Step 1: Create a Disqus Account

1. Go to [Disqus.com](https://disqus.com/)
2. Click "Sign Up" and create a new account
3. Verify your email address

### Step 2: Get API Key and Access Token

1. Log in to your Disqus account
2. Go to [Disqus API Applications](https://disqus.com/api/applications/)
3. Click "Register New Application"
4. Fill in the application details:
   - Name: "Disqus Vote Bot"
   - Description: "A bot for managing Disqus votes"
   - Website: Your website URL
   - Callback URL: http://localhost:3001 (or your server URL)
5. Click "Register"
6. You'll receive an API Key and API Secret
7. To get the Access Token:
   - Click on your application
   - Go to the "API Keys" tab
   - Click "Generate Access Token"
   - Authorize the application
   - Copy the Access Token

### Step 3: Store Credentials

1. Rename the `credentials-example.json` file to `credentials.json` in the project root
2. Replace the placeholder values with your actual Disqus API credentials:
```json
{
    "account_1": {
        "apiKey": "YOUR_API_KEY",
        "accessToken": "YOUR_ACCESS_TOKEN"
    },
    "account_2": {
        "apiKey": "ANOTHER_API_KEY",
        "accessToken": "ANOTHER_ACCESS_TOKEN"
    }
}
```

You can add as many accounts as you want by incrementing the account number (account_1, account_2, etc.).

## Usage

1. Start the server:
```bash
node index.js
```

2. Open your web browser and navigate to:
```
http://localhost:3001
```

3. Using the Web Interface:
   - Enter the Disqus Comment ID you want to vote on
   - Select either "Upvote" or "Downvote"
   - Enter the number of votes you want to cast
   - Click "Start Voting"

### Finding Comment IDs

1. Go to the Disqus comment you want to vote on
2. Right-click on the comment
3. Click "Inspect" or "Inspect Element"
4. Look for the `data-post-id` attribute in the HTML
5. Copy the value - this is your Comment ID

## How It Works

1. The bot uses multiple Disqus accounts to cast votes
2. For each vote:
   - Randomly selects an account from your credentials
   - Verifies the comment exists
   - Casts the vote
   - Verifies the vote was successful
3. The process continues until all requested votes are cast

## Security Notes

- Keep your `credentials.json` file secure and never share it
- Don't commit `credentials.json` to version control
- Use different accounts for upvotes and downvotes to avoid detection
- Don't cast too many votes in a short period to avoid rate limiting

## Troubleshooting

If you encounter issues:

1. Check your internet connection
2. Verify your API keys and access tokens are correct
3. Ensure the comment ID is valid
4. Check the server console for error messages
5. Make sure you haven't exceeded Disqus rate limits

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This tool is for educational purposes only. Use it responsibly and in accordance with Disqus's terms of service. The developers are not responsible for any misuse of this tool. 