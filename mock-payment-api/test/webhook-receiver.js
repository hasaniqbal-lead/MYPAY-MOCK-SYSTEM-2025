const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Store received webhooks
const webhooks = [];

// Webhook receiver endpoint
app.post('/webhook', (req, res) => {
    const webhook = {
        timestamp: new Date().toISOString(),
        headers: req.headers,
        body: req.body
    };
    
    webhooks.push(webhook);
    
    console.log('\n🔔 WEBHOOK RECEIVED:');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('-----------------------------------\n');
    
    // Acknowledge webhook
    res.json({
        success: true,
        message: 'Webhook received'
    });
});

// View all received webhooks
app.get('/webhooks', (req, res) => {
    res.json({
        count: webhooks.length,
        webhooks: webhooks
    });
});

// Clear webhooks
app.delete('/webhooks', (req, res) => {
    webhooks.length = 0;
    res.json({
        success: true,
        message: 'Webhooks cleared'
    });
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║      TEST WEBHOOK RECEIVER                 ║
╠════════════════════════════════════════════╣
║  🎯 Webhook URL: http://localhost:${PORT}/webhook
║  📊 View webhooks: http://localhost:${PORT}/webhooks
║  🗑️  Clear webhooks: DELETE /webhooks
╚════════════════════════════════════════════╝
    `);
});
