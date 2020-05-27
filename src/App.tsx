import React, { useCallback, ChangeEventHandler, useState, FormEventHandler, EventHandler, MouseEventHandler, useEffect } from 'react';
import './App.css';
import io from 'socket.io-client';

const socket = io.connect();
const initialName = localStorage.getItem('name') || "";
if (initialName) {
  socket.emit('name', initialName);
}

socket.on('connect', () => {
  socket.emit('name', localStorage.getItem('name') || "");
});

function useSocketState<T>(eventName: string, initialValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    const handler = (value: T) => {
      setValue(value);
    }
    socket.on(eventName, handler);
    return () => { socket.removeEventListener(eventName, handler); };
  }, [eventName, setValue]);

  const setValueProxy = useCallback((value: T) => {
    socket.emit(eventName, value);
  }, [eventName, value]);

  return [value, setValueProxy];
}

function App() {
  const [name, setName] = useState(initialName);
  const [submittedName, setSubmittedName] = useState(initialName);
  const [buzzList] = useSocketState<BuzzStat[]>('buzzlist', []);
  const [roundNumber, setRoundNumber] = useSocketState('round', 0);
  const [connected, setConnected] = useState(socket.connected);
  const inGame = !!submittedName;
  const isAdmin = submittedName === 'admin-dipun-';
  
  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.removeEventListener('connect', onConnect);
      socket.removeEventListener('disconnect', onDisconnect);
    };
  }, [setConnected]);
  
  const changeName = useCallback<ChangeEventHandler<HTMLInputElement>>(e => {
    setName(e.target.value);
  }, [setName])

  const enter = useCallback<FormEventHandler>(e => {
    e.preventDefault();
    socket.emit('name', name, () => {
      setSubmittedName(name);
      localStorage.setItem('name', name);
    });
  }, [socket, name]);

  const buzz = useCallback<MouseEventHandler<HTMLButtonElement>>(e => {
    socket.emit('buzz');
  }, [socket]);

  const exit = useCallback<MouseEventHandler<HTMLButtonElement>>(e => {
    setSubmittedName("");
    socket.emit('name', null, () => {
      localStorage.removeItem('name');
    });
  }, [socket]);

  const loginUi = () => (
    <form onSubmit={enter}>
      <h2>
        <label htmlFor="name">
          Enter your name:
        </label>
      </h2>
      <input type="text" id="name" value={name} onChange={changeName} />
      <button type="submit">Begin</button>
    </form>
  );

  const gameUi = () => (
    <>
      <button onClick={exit}>exit</button> 
      <h2>
        {submittedName}
      </h2>
      <div className="game-grid">
        <button className="buzzer" onClick={buzz}>
          I know the answer!
        </button>
        <div className="buzz-list">
          <ol>
            {buzzList.map(({name, time, active, wrong}) => (
              <li
                className={ active ? 'active' : wrong ? 'wrong' : undefined }
                key={time}>{name}: {time}</li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );

  const adminUi = () => (
    <>
      <button onClick={exit}>exit</button> 
      <h1>Round {roundNumber}</h1>
      <div>
        <button style={{fontSize: '2em', margin: 5}} onClick={() => setRoundNumber(roundNumber - 1)}>-</button>
        <button style={{fontSize: '2em', margin: 5}} onClick={() => setRoundNumber(roundNumber + 1)}>+</button>
      </div>
      <button onClick={() => socket.emit('reset')}>reset</button>
      <div className="buzz-list">
        <ol>
          {buzzList.map(({name, time, wrong, active}, i) => (
            <li key={time}
              className={ active ? 'active' : wrong ? 'wrong' : undefined }>
                {name}: {time} <button onClick={() => socket.emit('activate', i)}>activate</button>
            </li>
            ))}
        </ol>
      </div>
    </>
  );

  const contents = isAdmin ? adminUi() : inGame ? gameUi() : loginUi();

  return (
    <div className="App">
      <div className={connected ? 'conn_active' : 'conn_inactive'}>
        connection: {connected ? "active":"inactive"}
      </div>
      <header className="App-header">
        {contents}
      </header>
    </div>
  );
}

export default App;
