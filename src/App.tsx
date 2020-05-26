import React, { useCallback, ChangeEventHandler, useState, FormEventHandler, EventHandler, MouseEventHandler, useEffect } from 'react';
import BuzzStat from '../shared/BuzzStat';
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

  const quit = useCallback<MouseEventHandler<HTMLButtonElement>>(e => {
    setInGame(false);
    socket.emit('name', null, () => {
      localStorage.removeItem('name');
      setInGameName("");
    });
  }, [socket]);

  return (
    <div className="App">
      <header className="App-header">
        {!inGame && (
          <form onSubmit={enter}>
            <h2>
              <label htmlFor="name">
                Enter your name:
              </label>
            </h2>
            <input type="text" id="name" value={name} onChange={changeName} />
            <button type="submit">Begin</button>
          </form>
        ) || (
          <>
            <h2>
              {inGameName}<br/> 
              <button onClick={quit}>quit</button>
            </h2>
            <div className="game-grid">
              <div className="buzz-list">
                <ol>
                  {buzzList.map(({name, time, correct}) => (
                    <li
                      style={{ textDecoration: correct === false ? "line-through" : undefined }} 
                      key={time}>{name}: {time}</li>
                  ))}
                </ol>
              </div>
              <button className="buzzer" onClick={buzz}>
                BUZZ!
              </button>
            </div>
          </>
        )}
      </header>
    </div>
  );
}

export default App;
