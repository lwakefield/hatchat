import { useEffect, useState } from 'react';

import { initializeUser, newChannel } from '../lib/actions';
import { randomWordString } from '../lib/words';
import { generateEncryptionKey, exportEncryptionKey } from '../lib/crypto';

async function handleCreateChannel (ev) {
  ev.preventDefault();

  const input = ev.target.querySelector('[name="id"]');
  await newChannel(input.value);

  const key = await exportEncryptionKey(await generateEncryptionKey());

  window.location = `/${input.value}#${key}`;
}

async function initialize () {
  await initializeUser();
}

const HomePage = () => {
  const [ channelName ] = useState(randomWordString())
  useEffect(() => { initialize() }, []);

  return (
    <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleCreateChannel}>
        <h1>Start a conversation</h1>
        <input name="id" defaultValue={channelName} autoFocus />
        <button>Go!</button>
      </form>
    </div>
  );
}

export default HomePage;
