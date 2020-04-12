const crypto = require('crypto');

const { request } = require('@persea/persea');

const { query } = require('./db');

async function getAuthenticatedUser () {
    // We only accept rsa-sha512. We don't check the header since this is
    // hard-coded.

    const token = request.headers.authorization;
    const [ _header, _claim, _signature] = token.replace(/^Bearer /, '').split('.');

    const claim = JSON.parse(Buffer.from(_claim, 'base64'));

    if (claim.exp < new Date()) throw new Error('Unauthorized');

    const [ user ] = await query`SELECT * FROM users WHERE id=${claim.id}`;
    const authentic = crypto.verify(
        'RSA-SHA512',
        Buffer.from(`${_header}.${_claim}`),
        user.publicKey,
        Buffer.from(_signature, 'base64')
    );

    if (!authentic) throw new Error('Unauthorized');

    return user;
}

module.exports = { getAuthenticatedUser };
