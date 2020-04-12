import { useEffect } from 'react';
import { connect } from 'unistore/react';
import { useRouter } from 'next/router'

import { pollForMessages, initializeUser, sendMessage, deleteChannel, joinChannel } from '../lib/actions';
import { store } from '../lib/store';
import { locked, unlocked } from '../lib/svg';

async function initialize (channelId) {
  await initializeUser();
  await joinChannel(channelId);

  pollForMessages();
}

async function handleSendMessage (ev) {
  ev.preventDefault();

  const textarea = ev.target.querySelector('[name="message"]');

  if (textarea.value.trim() === '') return;

  await sendMessage(textarea.value);
  textarea.value = '';
}

async function handleKeyDown (ev) {
  if (!(ev.key === 'Enter' && !ev.shiftKey)) return;

  ev.stopPropagation();
  ev.preventDefault();

  const textarea = ev.target;
  if (textarea.value.trim() === '') return;
  await sendMessage(textarea.value);
  textarea.value = '';
}

async function handleDeleteChannel (ev) {
  const { channel } = store.getState();
  const keepGoing = confirm('Deleting this channel removes all messages. Are you sure?')
  if (!keepGoing) return;
  await deleteChannel(channel.id);
  window.location = '/';
}

function formatTime (date) {
  const d = new Date(date);
  const [ hours, minutes ] = [ d.getHours(), d.getMinutes() ]
    .map(String)
    .map(v => v.padStart(2, '0'));
  return `${hours}:${minutes}`;
}

const Channel = connect(['messages', 'channel', 'user'])(({ messages, channel, user }) => {
  const router = useRouter();
  const { channelId } = router.query;

  useEffect(() => {
    if (channelId) initialize(channelId);
  }, [channelId]);

  return <>
    <div style={{overflowAnchor: 'none'}}>
      {messages.map(message => (
        <div key={message.createdAt} style={{ opacity: message.decrypted ? 1 : 0.5 }}>
          { message.decrypted
            ? <img height={20} src={`data:image/svg+xml;base64,${btoa(locked)}`} />
            : <img height={20} src={`data:image/svg+xml;base64,${btoa(unlocked)}`} />
          }
          <span title={message.createdAt}>{ formatTime(message.createdAt) }</span>
          &nbsp;
          <strong title={message.fromUserId}>
            { message.username || message.fromUserId.split('-')[0] }
          </strong>
          &nbsp;
          <span>{message.message}</span>
        </div>
      ))}
    </div>

    <div style={{ overflowAnchor: 'auto', height: '1px' }}></div>

    <form
      onSubmit={handleSendMessage}
      style={{ display: 'flex', flexDirection: 'row', position: 'sticky', bottom: '1rem' }}
    >
      <textarea
        name="message"
        placeholder="Your message here..."
        style={{ width: '100%' }}
        onKeyDown={handleKeyDown}
        resizable="false"
      />
      <button>send</button>
    </form>
    {((user && user.id) === (channel && channel.ownerId)) &&
      <button onClick={handleDeleteChannel} style={{
        color: 'crimson',
        padding: '0',
        background: 'transparent',
        fontSize: '0.7rem',
        border: 'none',
      }}>end channel</button>
    }
    { /* TODO add regenerate identity feature */ }
  </>
})

export default Channel;
