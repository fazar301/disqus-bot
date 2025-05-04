const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: err.message || 'An unexpected error occurred'
    });
});

class DisqusAPI {
    constructor() {
        // Parse multiple accounts from credentials.json
        this.accounts = this.parseAccounts();
        if (this.accounts.length === 0) {
            throw new Error('No Disqus accounts configured. Please add accounts to credentials.json file.');
        }
        this.currentAccountIndex = 0;
        this.baseUrl = 'https://disqus.com/api/3.0';
    }

    parseAccounts() {
        try {
            const credentialsData = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
            const accounts = [];
            
            // Get all account keys and sort them numerically
            const accountKeys = Object.keys(credentialsData)
                .filter(key => key.startsWith('account_'))
                .sort((a, b) => {
                    const numA = parseInt(a.split('_')[1]);
                    const numB = parseInt(b.split('_')[1]);
                    return numA - numB;
                });
            
            // Add accounts in sorted order
            for (const key of accountKeys) {
                const account = credentialsData[key];
                if (account.apiKey && account.accessToken) {
                    accounts.push({
                        apiKey: account.apiKey,
                        accessToken: account.accessToken
                    });
                }
            }
            
            return accounts;
        } catch (error) {
            console.error('Error reading credentials.json:', error);
            return [];
        }
    }

    // Fisher-Yates shuffle algorithm
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    getNextAccount() {
        // Shuffle accounts array
        this.accounts = this.shuffleArray([...this.accounts]);
        // Get the first account after shuffling
        return this.accounts[0];
    }

    async voteComment(commentId, voteType) {
        const account = this.getNextAccount();
        console.log(`Using shuffled account for ${voteType}`);
        
        try {
            console.log(`Attempting to ${voteType} comment:`, commentId);
            
            // First, get the post details to verify it exists
            const postResponse = await axios.get(`${this.baseUrl}/posts/details.json`, {
                params: {
                    post: commentId,
                    api_key: account.apiKey,
                    access_token: account.accessToken
                }
            });

            console.log('Post details:', postResponse.data);

            if (postResponse.data.code !== 0) {
                throw new Error(`Failed to get post details: ${postResponse.data.response}`);
            }

            // Add delay before voting
            console.log(`Waiting 0 seconds before ${voteType}...`);
            await new Promise(resolve => setTimeout(resolve, 0));

            // Now attempt to vote
            const voteValue = voteType === 'upvote' ? 1 : -1;
            const response = await axios.post(`${this.baseUrl}/posts/vote.json`, {
                post: commentId,
                vote: voteValue,
                api_key: account.apiKey,
                access_token: account.accessToken
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            console.log(`${voteType} response:`, response.data);

            if (response.data.code !== 0) {
                throw new Error(`Disqus API Error: ${response.data.response}`);
            }

            // Check if the vote was actually registered
            const deltaField = voteType === 'upvote' ? 'likesDelta' : 'dislikesDelta';
            if (response.data.response[deltaField] === 0) {
                throw new Error(`${voteType} not registered - you may have already voted on this comment`);
            }

            // Add delay after voting
            console.log(`Waiting 0 seconds after ${voteType}...`);
            await new Promise(resolve => setTimeout(resolve, 0));

            // Verify the vote was successful by getting updated post details
            const updatedPostResponse = await axios.get(`${this.baseUrl}/posts/details.json`, {
                params: {
                    post: commentId,
                    api_key: account.apiKey,
                    access_token: account.accessToken
                }
            });

            console.log('Updated post details:', updatedPostResponse.data);

            return {
                originalResponse: response.data,
                updatedPost: updatedPostResponse.data,
                accountUsed: account.apiKey,
                voteType: voteType
            };
        } catch (error) {
            if (error.response) {
                console.error('Disqus API Error:', {
                    status: error.response.status,
                    data: error.response.data
                });
                throw new Error(`Disqus API Error: ${error.response.data.error || error.response.data.message}`);
            }
            throw error;
        }
    }
}

// Initialize API instance
const disqusAPI = new DisqusAPI();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/vote', async (req, res) => {
    try {
        const { commentId, voteCount, voteType } = req.body;
        
        if (!commentId || !voteCount || !voteType) {
            return res.status(400).json({ 
                error: 'Comment ID, vote count, and vote type are required',
                details: {
                    commentId: !commentId ? 'Missing' : 'Provided',
                    voteCount: !voteCount ? 'Missing' : 'Provided',
                    voteType: !voteType ? 'Missing' : 'Provided'
                }
            });
        }
        
        if (voteType !== 'upvote' && voteType !== 'downvote') {
            return res.status(400).json({ 
                error: 'Invalid vote type',
                details: {
                    provided: voteType,
                    expected: ['upvote', 'downvote']
                }
            });
        }
        
        let successCount = 0;
        const errors = [];
        const results = [];

        for (let i = 0; i < voteCount; i++) {
            try {
                console.log(`Attempt ${i + 1} of ${voteCount} (${voteType})`);
                const result = await disqusAPI.voteComment(commentId, voteType);
                successCount++;
                results.push(result);
                
                // Add delay between votes to avoid rate limiting
                if (i < voteCount - 1) {
                    console.log('Waiting 0 seconds before next attempt...');
                    await new Promise(resolve => setTimeout(resolve, 0)); // 6 seconds delay
                }
            } catch (error) {
                console.error(`Failed to ${voteType} attempt ${i + 1}:`, error.message);
                errors.push(error.message);
                
                // If we get a "you may have already voted" error, try the next account
                if (error.message.includes('already voted')) {
                    continue;
                }
            }
        }

        res.json({
            message: `Successfully ${voteType}d ${successCount} times`,
            successCount,
            results,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Vote request failed:', error);
        res.status(500).json({ 
            error: error.message,
            details: error.stack
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 