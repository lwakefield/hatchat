import * as uuid from 'uuid';

import { store } from './store';
import * as crypto from './crypto';
import { randomName } from './words';

async function generateToken () {
    const { user } = store.getState();
    const VALID_MS = 60 * 1000;
    return await crypto.generateToken(
        { id: user.id, exp: new Date(Date.now() + VALID_MS) },
        user.keyPair.privateKey
    );
}

export async function initializeUser () {
    if (localStorage.user) {
        const user = JSON.parse(localStorage.user);
        Object.assign(user, { keyPair: await crypto.importB64Identity(user.keyPair) });
        store.setState({ user });
    } else {
        const user = {
            id: uuid.v4(),
            username: randomName(),
            keyPair: await crypto.generateIdentity(),
        };

        const { privateKey, publicKey } = await crypto.exportB64Identity(user.keyPair);

        await fetch('/api/users', {
            method: 'POST',
            body: JSON.stringify({
                id: user.id,
                username: user.username,
                publicKey: await crypto.exportPEMPublicKey(user.keyPair)
            }),
        });

        localStorage.user = JSON.stringify({
            ...user,
            keyPair: { privateKey, publicKey },
        });

        store.setState({ user });
    }

    try {
        const encryptionKey = await crypto.importEncryptionKey(
            window.location.hash.replace(/^#/, '')
        );
        store.setState({ encryptionKey });
    } catch (e) { /* if we are on the homepage, there is probably no key */ }
}

export async function newChannel (id) {
    const channel = { id };
    await fetch('/api/channels', {
        method: 'POST',
        headers: { authorization: await generateToken() },
        body: JSON.stringify({ ...channel, inviteModel: 'self' }),
    });
    store.setState({ channel });
}

export async function pollForMessages () {
    while (true) {
        const { channel, messages, encryptionKey } = store.getState();

        const since = messages.length ? messages[messages.length - 1].createdAt : '-infinity';

        const newMessages = await fetch(`/api/messages?channelId=${channel.id}&since=${encodeURIComponent(since)}`, {
            headers: { authorization: await generateToken() },
        }).then(v => v.json());

        for (const message of newMessages) {
            try {
                const decoded = await crypto.decryptFromB64(
                    message.payload,
                    encryptionKey
                );

                const { messages } = store.getState();
                store.setState({ messages: [...messages, {
                    createdAt: message.createdAt,
                    username: message.username,
                    fromUserId: message.fromUserId,
                    message: decoded,
                    decrypted: true,
                }] });
            } catch (e) {
                const { messages } = store.getState();
                store.setState({ messages: [...messages, {
                    createdAt: message.createdAt,
                    username: message.username,
                    fromUserId: message.fromUserId,
                    message: message.payload.message,
                    decrypted: false,
                }] });
            }
        }
    }
}

export async function sendMessage (message) {
    const { channel, encryptionKey } = store.getState();

    const payload = await crypto.encryptToB64(message, encryptionKey);

    await fetch('/api/messages', {
        method: 'POST',
        headers: { authorization: await generateToken() },
        body: JSON.stringify({ channelId: channel.id, payload }),
    });
}

export async function joinChannel (channelId) {
    const { user } = store.getState();
    await fetch('/api/channels/subscribe', {
        method: 'POST',
        headers: { authorization: await generateToken() },
        body: JSON.stringify({ channelId, userId: user.id }),
    });
    const channel = await fetch(`/api/channels/${channelId}`, {
        headers: { authorization: await generateToken() },
    }).then(v => v.json());
    store.setState({ channel });
}

export async function deleteChannel (channelId) {
    await fetch(`/api/channels/${channelId}`, {
        method: 'DELETE',
        headers: { authorization: await generateToken() },
    });
}
