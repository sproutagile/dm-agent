const https = require('https');

const data = JSON.stringify({
    chatInput: "Test connectivity",
    sessionId: "test-session"
});

const options = {
    hostname: 'agile.sprout.ph',
    path: '/webhook/049a56fd-7cf2-46b6-abe9-b24d41ecc092/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log("Sending test request...");

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
