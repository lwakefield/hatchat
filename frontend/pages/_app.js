import { Provider } from 'unistore/react';

import { store } from '../lib/store';

import './styles.css'

export default function ({ Component, pageProps }) {
  return (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem'
    }}>
      <div style={{ maxWidth: '50rem', width: '100%', margin: '0 auto' }}>
        <Provider store={store}>
        <Component {...pageProps} />
        </Provider>
    </div>
    </div>
  );
}
