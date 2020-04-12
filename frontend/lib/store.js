import createStore from 'unistore';

export const store = createStore({
    messages: [],
    channel: null,
    user: null,
    encryptionKey: null,
});
