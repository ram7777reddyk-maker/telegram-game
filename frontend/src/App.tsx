import { useEffect, useState } from "react";
import Card from "./components/Card";import GameOverOverlay from "./components/GameOverOverlay";
import {
  gameWebSocket
} from "./services/websocket";
import type {
  Card as CardType,
  PublicGameState
} from "./types/game";

function App() {
  const [connected, setConnected] =
    useState(false);

  const [roomId, setRoomId] =
    useState("");

  const [playerId, setPlayerId] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [joined, setJoined] =
    useState(false);

  const [game, setGame] =
    useState<PublicGameState | null>(null);

  const [cards, setCards] =
    useState<CardType[]>([]);

  const [selectedIndex, setSelectedIndex] =
    useState<number | null>(null);

  const [draggedIndex, setDraggedIndex] =
    useState<number | null>(null);

  const handleDragStart = (
    index: number
  ) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const handleDrop = (
    event: React.DragEvent<HTMLButtonElement>,
    dropIndex: number
  ) => {
    event.preventDefault();

    if (
      draggedIndex === null ||
      draggedIndex === dropIndex
    ) {
      setDraggedIndex(null);
      return;
    }

    setCards(currentCards => {
      const updatedCards = [...currentCards];

      const [movedCard] =
        updatedCards.splice(
          draggedIndex,
          1
        );

      updatedCards.splice(
        dropIndex,
        0,
        movedCard
      );

      const cardOrder =
        updatedCards.map(card =>
          `${card.suit}-${card.rank}-${card.isJoker ? "joker" : "normal"}`
        );

      gameWebSocket.reorderCards(
        cardOrder
      );

      return updatedCards;
    });

    setSelectedIndex(null);
    setDraggedIndex(null);
  };
  const [message, setMessage] =
    useState("Connecting...");

  useEffect(() => {
    const savedPlayerId =
      sessionStorage.getItem(
        "rummy_player_id"
      ) ||
      `player-${Math.random()
        .toString(36)
        .substring(2, 10)}`;

    sessionStorage.setItem(
      "rummy_player_id",
      savedPlayerId
    );

    setPlayerId(savedPlayerId);

    const savedUsername =
      sessionStorage.getItem(
        "rummy_username"
      ) || "Player";

    setUsername(savedUsername);

    gameWebSocket.connect(
      serverMessage => {
        switch (serverMessage.type) {

          case "CONNECTED":
            setMessage(
              "Connected to game server"
            );
            break;

          case "ROOM_CREATED":
            if (serverMessage.roomId) {
              setRoomId(
                serverMessage.roomId
              );

              setMessage(
                `Room created: ${serverMessage.roomId}`
              );
            }
            break;

          case "ROOM_JOINED":
            setJoined(true);

            setMessage(
              "Joined room"
            );
            break;

          case "GAME_STARTED":
            if (serverMessage.game) {
              setGame(
                serverMessage.game
              );
            }

            setMessage(
              "Game started"
            );
            break;

          case "YOUR_CARDS":
            if (
              serverMessage.player
            ) {
              setCards(
                serverMessage.player.cards
              );
            }

            break;

          case "CARD_DRAWN":
            if (
              serverMessage.player
            ) {
              setCards(
                serverMessage.player.cards
              );
            }

            setMessage(
              "Card drawn"
            );

            break;

          case "CARD_DRAWN_FROM_DISCARD":
            if (
              serverMessage.player
            ) {
              setCards(
                serverMessage.player.cards
              );
            }

            setMessage(
              "Card drawn from discard pile"
            );

            break;

          case "CARD_DISCARDED":
            if (
              serverMessage.player
            ) {
              setCards(
                serverMessage.player.cards
              );
            }
            setSelectedIndex(null);
            setMessage(
              "Card discarded"
            );
            break;
          case "GAME_STATE_UPDATED":
            if (serverMessage.game) {
              setGame(
                serverMessage.game
              );
            }

            break;

          case "INVALID_DECLARATION":
            if (
              serverMessage.player
            ) {
              setCards(
                serverMessage.player.cards
              );
            }

            setMessage(
              serverMessage.message ||
              "Invalid declaration"
            );

            break;

          case "GAME_FINISHED":
            if (serverMessage.game) {
              setGame(
                serverMessage.game
              );
            }

            setMessage(
              "Game finished"
            );

            break;

          case "ERROR":
            setMessage(
              serverMessage.message ||
              "Server error"
            );

            break;

          default:
            console.log(
              "Unhandled server message:",
              serverMessage
            );
        }
      },

      () => {
        setConnected(true);
        setMessage(
          "Connected to game server"
        );
      },

      () => {
        setConnected(false);
        setMessage(
          "Disconnected from server"
        );
      }
    );

    return () => {
      gameWebSocket.disconnect();
    };
  }, []);

  function createRoom() {
    gameWebSocket.createRoom();
    setMessage(
      "Creating room..."
    );
  }

  function joinRoom() {
    if (!roomId.trim()) {
      setMessage(
        "Enter a room ID"
      );
      return;
    }

    gameWebSocket.joinRoom(
      roomId.trim(),
      playerId,
      username || "Player"
    );

    setJoined(true);

    setMessage(
      "Joining room..."
    );
  }

  function startGame() {
    gameWebSocket.startGame();

    setMessage(
      "Starting game..."
    );
  }

  function drawCard() {
    gameWebSocket.drawCard();
  }

  function drawDiscard() {
    gameWebSocket.drawFromDiscard();
  }

  function discardCard() {
    if (
      selectedIndex === null
    ) {
      setMessage(
        "Select a card first"
      );
      return;
    }

    gameWebSocket.discardCard(
      selectedIndex
    );

    setSelectedIndex(null);
  }

  function declare() {
    gameWebSocket.declare();

    setMessage(
      "Submitting declaration..."
    );
  }

  const topDiscard =
    game?.discardPile?.[
      game.discardPile.length - 1
    ];

  const isWinner = game?.winnerPlayerId === playerId;const winnerName = game?.players.find(  player => player.playerId === game?.winnerPlayerId)?.username || game?.winnerPlayerId || "Player";const isMyTurn =
    game?.currentPlayerId ===
    playerId;

  const isPlaying =
    game?.status === "playing";

  return (
    <div className="game-page">

      <header className="top-bar">

        <div>
          <h1>Rummy</h1>

          <span>
            13 Card Game
          </span>
        </div>

        <div className="room-info">

          <span>
            {connected
              ? "● Connected"
              : "○ Disconnected"}
          </span>

          <strong>
            {roomId || "No Room"}
          </strong>

        </div>

      </header>

      <main className="rummy-table">

        {!joined && (
          <section className="room-panel">

            <h2>
              Join Rummy
            </h2>

            <input
              value={username}
              onChange={event =>
                setUsername(
                  event.target.value
                )
              }
              placeholder="Your name"
            />

            <input
              value={roomId}
              onChange={event =>
                setRoomId(
                  event.target.value
                )
              }
              placeholder="Room ID"
            />

            <div className="room-buttons">

              <button
                className="action-button"
                onClick={
                  createRoom
                }
                disabled={!connected}
              >
                Create Room
              </button>

              <button
                className="action-button secondary"
                onClick={
                  joinRoom
                }
                disabled={
                  !connected
                }
              >
                Join Room
              </button>

            </div>

            <p>
              {message}
            </p>

          </section>
        )}

        {joined && (
          <>
            <section className="opponents">

              {game?.players
                .filter(
                  player =>
                    player.playerId !==
                    playerId
                )
                .map(
                  (player, index) => (
                    <div
                      key={
                        player.playerId
                      }
                      className={`player-seat ${
                        index === 0
                          ? "top-seat"
                          : index % 2 === 0
                          ? "left-seat"
                          : "right-seat"
                      }`}
                    >

                      <div className="avatar">
                        {(
                          player.username ||
                          "P"
                        )
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>
                          {player.username ||
                            player.playerId}
                        </strong>

                        <span>
                          {player.cardCount} cards
                        </span>
                      </div>

                    </div>
                  )
                )}

            </section>

            <section className="table-center">

              <div className="wild-joker">

                <span>
                  WILD JOKER
                </span>

                <strong>
                  {game?.wildJokerRank ||
                    "-"}
                </strong>

              </div>

              {!isPlaying &&
                game?.status !==
                  "finished" && (
                  <button
                    className="action-button"
                    onClick={
                      startGame
                    }
                  >
                    Start Game
                  </button>
                )}

              <div className="table-actions">

                <button
                  className="deck"
                  onClick={
                    drawCard
                  }
                  disabled={
                    !isMyTurn ||
                    !isPlaying
                  }
                >
                  <span>
                    🂠
                  </span>

                  <small>
                    DECK
                  </small>

                </button>

                <button
                  className="discard"
                  onClick={
                    drawDiscard
                  }
                  disabled={
                    !isMyTurn ||
                    !isPlaying ||
                    !topDiscard
                  }
                >

                  {topDiscard ? (
                    <Card
                      card={
                        topDiscard
                      }
                    />
                  ) : (
                    <span>
                      EMPTY
                    </span>
                  )}

                  <small>
                    DISCARD
                  </small>

                </button>

              </div>

              <div className="status-message">

                {isMyTurn &&
                isPlaying
                  ? "Your turn"
                  : message}

              </div>

            </section>

            <section className="my-area">

              <div className="my-player">

                <div className="avatar">
                  YOU
                </div>

                <div>
                  <strong>
                    {username}
                  </strong>

                  <span>
                    {cards.length} cards
                  </span>
                </div>

              </div>

              <div className="hand">

                {cards.map(
                  (card, index) => (
                    <Card
                      key={`${card.suit}-${card.rank}-${index}`}
                      card={card}
                      selected={
                        selectedIndex ===
                        index
                      }
                      onClick={() =>
                        setSelectedIndex(
                          selectedIndex ===
                            index
                            ? null
                            : index
                        )
                      }
                      draggable={true}
                      onDragStart={() =>
                        handleDragStart(index)
                      }
                      onDragOver={
                        handleDragOver
                      }
                      onDrop={event =>
                        handleDrop(
                          event,
                          index
                        )
                      }
                    />
                  )
                )}

              </div>

              {game?.status === "finished" && (
  <GameOverOverlay
    isWinner={isWinner}
    winnerName={winnerName}
  />
)}

<div className="bottom-actions">

                <button
                  className="action-button"
                  onClick={
                    drawCard
                  }
                  disabled={
                    !isMyTurn ||
                    !isPlaying
                  }
                >
                  Draw
                </button>

                <button
                  className="action-button secondary"
                  onClick={
                    discardCard
                  }
                  disabled={
                    !isMyTurn ||
                    !isPlaying ||
                    selectedIndex === null
                  }
                >
                  Discard
                </button>

                <button
                  className="action-button declare"
                  onClick={
                    declare
                  }
                  disabled={
                    !isMyTurn ||
                    !isPlaying ||
                    cards.length !== 13
                  }
                >
                  {cards.length === 14
                    ? "Discard a Card"
                    : "Declare"}
                </button>

              </div>

            </section>
          </>
        )}

      </main>
    </div>
  );
}

export default App;














