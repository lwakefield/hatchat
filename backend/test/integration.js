const assert = require('assert');
const crypto = require('crypto');
const http = require('http');

const uuid = require('uuid');

async function request (url, options, body) {
    return new Promise((resolve) => {
        const req = http.request(url, options,
            (res) => {
                res.setEncoding('utf8');
                let body = '';
                res.on('data', (chunk) => body += chunk.toString());
                res.on('end', () => {
                    resolve({
                        headers: res.headers,
                        body,
                        status: res.statusCode,
                    })
                });
            }
        );
        if (body) req.write(body);
        req.end();
    });
}

function token (_claim, _privateKey) {
    const header = Buffer.from(JSON.stringify({ alg: 'RSA-SHA512', type: 'JWT' }));
    const claim = Buffer.from(_claim);
    const privateKey = Buffer.from(_privateKey);
    const signature = crypto.sign('RSA-SHA512', claim, privateKey)

    return `${header.toString('base64')}.${claim.toString('base64')}.${signature.toString('base64')}`
}

test('flow #1', async () => {
    const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: 'pkcs1',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs1',
            format: 'pem'
        }
    });
    const userId = uuid.v4();

    // create a user
    {
        const res = await request(
            `${process.env.API_URL}/users`,
            { method: 'POST' },
            JSON.stringify({ id: userId, publicKey: keyPair.publicKey })
        );

        assert(res.status === 200);
    }

    const channelId = uuid.v4();
    const tok = token(JSON.stringify({ id: userId }), keyPair.privateKey );

    // create a channel
    {
        const res = await request(
            `${process.env.API_URL}/channels`,
            { method: 'POST', headers: { authorization: tok } },
            JSON.stringify({ id: channelId })
        );

        assert(res.status === 200);
    }

    // list the users channels
    {
        const res = await request(
            `${process.env.API_URL}/channels`,
            { method: 'GET', headers: { authorization: tok } },
        );

        assert(res.status === 200);
        assert.deepEqual(JSON.parse(res.body), [ { id: channelId, ownerId: userId } ])
    }

    // send some messages
    {
        let res = await request(
            `${process.env.API_URL}/messages`,
            { method: 'POST', headers: { authorization: tok }, },
            JSON.stringify({
                channelId,
                payload: 'hello world',
            })
        );

        assert(res.status === 200);

        res = await request(
            `${process.env.API_URL}/messages`,
            { method: 'POST', headers: { authorization: tok }, },
            JSON.stringify({
                channelId,
                payload: { message: 'hello world' },
            })
        );

        assert(res.status === 200);

        res = await request(
            `${process.env.API_URL}/messages`,
            { method: 'POST', headers: { authorization: tok }, },
            JSON.stringify({
                channelId,
                payload: { message: 'hello world' },
            })
        );

        assert(res.status === 200);
    }

    // list some messages
    {
        const res = await request(
            `${process.env.API_URL}/messages?channelId=${channelId}`,
            { method: 'GET', headers: { authorization: tok }, },
        );

        assert(res.status === 200);
        assert(res.body.includes('"hello world"'));
    }
});
