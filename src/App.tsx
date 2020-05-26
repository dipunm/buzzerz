import React, { useCallback, ChangeEventHandler, useState, FormEventHandler, EventHandler, MouseEventHandler, useEffect } from 'react';
import './App.css';
import io from 'socket.io-client';

const socket = io.connect();
const onLoadName = localStorage.getItem('name') || "";
if (onLoadName) {
  socket.emit('name', onLoadName);
}

function App() {
  const [name, setName] = useState(onLoadName);
  const [inGame, setInGame] = useState(onLoadName !== "");
  const [inGameName, setInGameName] = useState(onLoadName);
  const [buzzList, setBuzzList] = useState<BuzzStat[]>([]);

  useEffect(() => {
    socket.on('buzzlist', (buzzlist: BuzzStat[]) => {
      console.log('hi!');
      setBuzzList(buzzlist);
    })
  }, [socket])
  
  const changeName = useCallback<ChangeEventHandler<HTMLInputElement>>(e => {
    setName(e.target.value);
  }, [setName])

  const enter = useCallback<FormEventHandler>(e => {
    e.preventDefault();
    socket.emit('name', name, () => {
      setInGameName(name);
      setInGame(true);
      localStorage.setItem('name', name);
    });
  }, [socket, name]);

  const buzz = useCallback<MouseEventHandler<HTMLButtonElement>>(e => {
    socket.emit('buzz');
  }, [socket]);

  const exit = useCallback<MouseEventHandler<HTMLButtonElement>>(e => {
    setInGame(false);
    socket.emit('name', null, () => {
      localStorage.removeItem('name');
      setInGameName("");
    });
  }, [socket]);

  const loginUi = (
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

  const gameUi = (
    <>
      <button onClick={exit}>exit</button> 
      <h2>
        {inGameName}
      </h2>
      <div className="game-grid">
        <button className="buzzer" onClick={buzz}>
          I know the answer!
        </button>
        <div className="buzz-list">
          <ol>
            {buzzList.map(({name, time, correct}) => (
              <li
                style={{ textDecoration: correct === false ? "line-through" : undefined }} 
                key={time}>{name}: {time}</li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );

  const adminUi = (
     null
  );

  const isAdmin = false

  const contents = isAdmin ? adminUi : inGame ? gameUi : loginUi;

  return (
    <div className="App">
      <header className="App-header">
        {contents}
      </header>
    </div>
  );
}

export default App;
