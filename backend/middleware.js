const { randomBytes } = require('crypto');
const { request, response } = require('@persea/persea');

function log (val) {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        ...val,
    }));
}

let requestsInFlight = 0;

async function before () {
    request.requestId = randomBytes(16).toString('hex');
    requestsInFlight += 1;
    log({
        message: "inbound request",
        requestsInFlight,
        pid: process.pid,
        requestId: request.requestId,
        method: request.method,
        url: request.url,
    });
};

function after () {
    requestsInFlight -= 1;
    log({
        message: "outbound response",
        requestsInFlight,
        pid: process.pid,
        requestId: request.requestId,
        method: request.method,
        url: request.url,
        status: response.status
    });
};

module.exports = { before, after };
