import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

import { gameRoomManager } from "./gameRoomManager.js";

import {
  createRoomInDatabase,
  addPlayerToDatabase,
  removePlayerFromDatabase
} from "../services/roomService.js";

import { gameManager } from "../game/gameManager.js";

import {
  getPublicGameState,
  getPrivatePlayerState
} from "../game/gameView.js";

import {
  saveGameState,
  deleteGameState
} from "../services/redisGameService.js";

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws"
  });

  wss.on("connection", (socket: WebSocket) => {
    console.log("WebSocket client connected");

    let currentRoomId: string | null = null;
    let currentPlayerId: string | null = null;

    socket.send(
      JSON.stringify({
        type: "CONNECTED",
        message: "WebSocket connection established"
      })
    );

    socket.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());

        console.log("WebSocket message:", data);

        switch (data.type) {

          case "PING": {
            socket.send(
              JSON.stringify({
                type: "ACK",
                received: data
              })
            );

            break;
          }

          case "CREATE_ROOM": {
            const room = gameRoomManager.createRoom();

            await createRoomInDatabase(room.roomId);

            const game =
              gameManager.createGame(room.roomId);

            await saveGameState(game);

            console.log(
              "Game state saved to Redis:",
              room.roomId
            );

            socket.send(
              JSON.stringify({
                type: "ROOM_CREATED",
                roomId: room.roomId,
                playerCount: 0
              })
            );

            break;
          }

          case "JOIN_ROOM": {
            const {
              roomId,
              playerId,
              username
            } = data;

            if (!roomId || !playerId) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message:
                    "roomId and playerId are required"
                })
              );

              break;
            }

            const game =
              gameManager.getGame(roomId);

            if (!game) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message: "Game room not found"
                })
              );

              break;
            }

            const existingPlayer =
              game.players.find(
                player => player.playerId === playerId
              );

            if (
              game.status === "playing" &&
              !existingPlayer
            ) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message:
                    "Game has already started"
                })
              );

              break;
            }

            const joined =
              gameRoomManager.joinRoom(
                roomId,
                playerId,
                socket,
                username
              );

            if (!joined) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message: "Room not found"
                })
              );

              break;
            }

            const isReconnect =
              game.players.some(
                player => player.playerId === playerId
              );

            let gamePlayerAdded = true;

            if (!isReconnect) {
              gamePlayerAdded =
                gameManager.addPlayer(
                  roomId,
                  playerId,
                  username
                );
            }

            if (!gamePlayerAdded) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message:
                    "Unable to add player to game"
                })
              );

              gameRoomManager.leaveRoom(
                roomId,
                playerId
              );

              break;
            }

            await addPlayerToDatabase(
              roomId,
              playerId,
              username
            );

            const updatedGame =
              gameManager.getGame(roomId);

            if (updatedGame) {
              await saveGameState(updatedGame);

              console.log(
                "Updated game state saved to Redis:",
                roomId
              );
            }

            currentRoomId = roomId;
            currentPlayerId = playerId;

            const playerCount =
              gameRoomManager.getRoomPlayerCount(
                roomId
              );

            if (isReconnect) {
              socket.send(
                JSON.stringify({
                  type: "ROOM_JOINED",
                  roomId,
                  playerId,
                  username,
                  playerCount
                })
              );

              socket.send(
                JSON.stringify({
                  type: "GAME_STATE_UPDATED",
                  game:
                    getPublicGameState(
                      updatedGame!
                    )
                })
              );

              socket.send(
                JSON.stringify({
                  type: "YOUR_CARDS",
                  player:
                    getPrivatePlayerState(
                      updatedGame!,
                      playerId
                    )
                })
              );

              console.log(
                "Player reconnected:",
                roomId,
                playerId
              );
            } else {
              gameRoomManager.broadcast(roomId, {
                type: "PLAYER_JOINED",
                playerId,
                username,
                playerCount
              });
            }

            break;
          }

          case "START_GAME": {
            if (
              !currentRoomId ||
              !currentPlayerId
            ) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message:
                    "You must join a room first"
                })
              );

              break;
            }

            const game =
              gameManager.getGame(
                currentRoomId
              );

            if (!game) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message: "Game not found"
                })
              );

              break;
            }

            try {
              gameManager.startGame(
                currentRoomId,
                13
              );
            } catch (error) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message:
                    error instanceof Error
                      ? error.message
                      : "Unable to start game"
                })
              );

              break;
            }

            const startedGame =
              gameManager.getGame(
                currentRoomId
              );

            if (!startedGame) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message:
                    "Game state unavailable after start"
                })
              );

              break;
            }

            await saveGameState(startedGame);

            console.log(
              "Started game state saved to Redis:",
              currentRoomId
            );

            gameRoomManager.broadcast(
              currentRoomId,
              {
                type: "GAME_STARTED",
                game:
                  getPublicGameState(
                    startedGame
                  )
              }
            );

            for (
              const player
              of startedGame.players
            ) {
              const roomPlayer =
                gameRoomManager
                  .getRoom(currentRoomId)
                  ?.players.get(
                    player.playerId
                  );

              if (
                roomPlayer &&
                roomPlayer.socket.readyState ===
                  WebSocket.OPEN
              ) {
                roomPlayer.socket.send(
                  JSON.stringify({
                    type: "YOUR_CARDS",
                    player:
                      getPrivatePlayerState(
                        startedGame,
                        player.playerId
                      )
                  })
                );
              }
            }

            break;
          }

          case "REORDER_CARDS": {
            if (
              !currentRoomId ||
              !currentPlayerId
            ) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message:
                    "You must join a room first"
                })
              );
              break;
            }

            const cardOrder =
              data.cardOrder;

            if (
              !Array.isArray(cardOrder)
            ) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message:
                    "cardOrder is required"
                })
              );
              break;
            }

            try {
              gameManager.reorderPlayerCards(
                currentRoomId,
                currentPlayerId,
                cardOrder
              );

              const updatedGame =
                gameManager.getGame(
                  currentRoomId
                );

              if (!updatedGame) {
                throw new Error(
                  "Game state not found"
                );
              }

              await saveGameState(
                updatedGame
              );

              socket.send(
                JSON.stringify({
                  type: "CARDS_REORDERED",
                  player:
                    getPrivatePlayerState(
                      updatedGame,
                      currentPlayerId
                    )
                })
              );

              console.log(
                "Card order updated and saved:",
                currentRoomId,
                currentPlayerId
              );
            } catch (error) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message:
                    error instanceof Error
                      ? error.message
                      : "Unable to reorder cards"
                })
              );
            }

            break;
          }

          case "DISCARD_CARD": {
            if (
              !currentRoomId ||
              !currentPlayerId
            ) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message:
                    "You must join a room first"
                })
              );
              break;
            }
            const cardIndex = Number(data.cardIndex);
            if (!Number.isInteger(cardIndex)) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message:
                    "cardIndex is required"
                })
              );
              break;
            }
            try {
              const discardedCard =
                gameManager.discardCard(
                  currentRoomId,
                  currentPlayerId,
                  cardIndex
                );
              const updatedGame =
                gameManager.getGame(
                  currentRoomId
                );
              if (!updatedGame) {
                throw new Error(
                  "Game state not found"
                );
              }
              await saveGameState(
                updatedGame
              );
              socket.send(
                JSON.stringify({
                  type: "CARD_DISCARDED",
                  card: discardedCard,
                  player:
                    getPrivatePlayerState(
                      updatedGame,
                      currentPlayerId
                    )
                })
              );
              gameRoomManager.broadcast(
                currentRoomId,
                {
                  type: "GAME_STATE_UPDATED",
                  game:
                    getPublicGameState(
                      updatedGame!
                    )
                }
              );
              console.log(
                "Card discarded and game state saved to Redis:",
                currentRoomId
              );
            } catch (error) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message:
                    error instanceof Error
                      ? error.message
                      : "Unable to discard card"
                })
              );
            }
            break;
          }
          case "DRAW_FROM_DISCARD": {
            if (
              !currentRoomId ||
              !currentPlayerId
            ) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message:
                    "You must join a room first"
                })
              );

              break;
            }

            try {
              const drawnCard =
                gameManager.drawFromDiscardPile(
                  currentRoomId,
                  currentPlayerId
                );

              const updatedGame =
                gameManager.getGame(
                  currentRoomId
                );

              if (!updatedGame) {
                throw new Error(
                  "Game state not found"
                );
              }

              await saveGameState(
                updatedGame
              );

              socket.send(
                JSON.stringify({
                  type: "CARD_DRAWN_FROM_DISCARD",
                  card: drawnCard,
                  player:
                    getPrivatePlayerState(
                      updatedGame,
                      currentPlayerId
                    )
                })
              );

              gameRoomManager.broadcast(
                currentRoomId,
                {
                  type: "GAME_STATE_UPDATED",
                  game:
                    getPublicGameState(
                      updatedGame!
                    )
                }
              );

              console.log(
                "Card drawn from discard pile:",
                currentRoomId
              );

            } catch (error) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message:
                    error instanceof Error
                      ? error.message
                      : "Unable to draw from discard pile"
                })
              );
            }

            break;
          }
          case "DRAW_CARD": {
            if (
              !currentRoomId ||
              !currentPlayerId
            ) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message:
                    "You must join a room first"
                })
              );

              break;
            }

            try {
              const drawnCard =
                gameManager.drawCard(
                  currentRoomId,
                  currentPlayerId
                );

              const updatedGame =
                gameManager.getGame(
                  currentRoomId
                );

              if (!updatedGame) {
                throw new Error(
                  "Game state not found"
                );
              }

              await saveGameState(
                updatedGame
              );

              socket.send(
                JSON.stringify({
                  type: "CARD_DRAWN",
                  card: drawnCard,
                  player:
                    getPrivatePlayerState(
                      updatedGame,
                      currentPlayerId
                    )
                })
              );

              gameRoomManager.broadcast(
                currentRoomId,
                {
                  type: "GAME_STATE_UPDATED",
                  game:
                    getPublicGameState(
                      updatedGame!
                    )
                }
              );

              console.log(
                "Card drawn and game state saved to Redis:",
                currentRoomId
              );

            } catch (error) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message:
                    error instanceof Error
                      ? error.message
                      : "Unable to draw card"
                })
              );
            }

            break;
          }

          case "DECLARE": {
            if (
              !currentRoomId ||
              !currentPlayerId
            ) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message:
                    "You must join a room first"
                })
              );

              break;
            }

            try {
              const valid =
                gameManager.declareGame(
                  currentRoomId,
                  currentPlayerId
                );

              const updatedGame =
                gameManager.getGame(
                  currentRoomId
                );

              if (!updatedGame) {
                throw new Error(
                  "Game state not found"
                );
              }

              await saveGameState(
                updatedGame
              );

              if (valid) {
                gameRoomManager.broadcast(
                  currentRoomId,
                  {
                    type: "GAME_FINISHED",
                    game:
                      getPublicGameState(
                        updatedGame
                      )
                  }
                );

                console.log(
                  "VALID DECLARATION:",
                  currentRoomId,
                  currentPlayerId
                );
              } else {
                socket.send(
                  JSON.stringify({
                    type: "INVALID_DECLARATION",
                    message:
                      "Invalid Rummy declaration",
                    player:
                      getPrivatePlayerState(
                        updatedGame,
                        currentPlayerId
                      )
                  })
                );

                console.log(
                  "INVALID DECLARATION:",
                  currentRoomId,
                  currentPlayerId
                );
              }

            } catch (error) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  message:
                    error instanceof Error
                      ? error.message
                      : "Unable to declare"
                })
              );
            }

            break;
          }
          case "LEAVE_ROOM": {
            if (
              currentRoomId &&
              currentPlayerId
            ) {
              const roomId =
                currentRoomId;

              const playerId =
                currentPlayerId;

              await removePlayerFromDatabase(
                roomId,
                playerId
              );

              gameManager.removePlayer(
                roomId,
                playerId
              );

              gameRoomManager.leaveRoom(
                roomId,
                playerId
              );

              const updatedGame =
                gameManager.getGame(roomId);

              if (
                updatedGame &&
                updatedGame.players.length > 0
              ) {
                await saveGameState(
                  updatedGame
                );
              } else {
                await deleteGameState(
                  roomId
                );

                gameManager.deleteGame(
                  roomId
                );
              }

              socket.send(
                JSON.stringify({
                  type: "ROOM_LEFT",
                  roomId
                })
              );

              currentRoomId = null;
              currentPlayerId = null;
            }

            break;
          }

          default: {
            socket.send(
              JSON.stringify({
                type: "ERROR",
                message:
                  `Unknown message type: ${data.type}`
              })
            );
          }
        }

      } catch (error) {

        console.error(
          "WebSocket message error:",
          error
        );

        socket.send(
          JSON.stringify({
            type: "ERROR",
            message:
              "Server error while processing message"
          })
        );
      }
    });

    socket.on("close", async () => {
      if (
        currentRoomId &&
        currentPlayerId
      ) {
        const roomId =
          currentRoomId;

        const playerId =
          currentPlayerId;

        // A WebSocket disconnect is not the same as leaving the game.
        // Keep the player and game state so the player can reconnect.
        gameRoomManager.leaveRoom(
          roomId,
          playerId
        );

        const updatedGame =
          gameManager.getGame(roomId);

        if (updatedGame) {
          await saveGameState(
            updatedGame
          );
        }
      }

      console.log(
        "WebSocket client disconnected"
      );
    });

    socket.on("error", (error) => {
      console.error(
        "WebSocket error:",
        error
      );
    });
  });

  console.log(
    "WebSocket server initialized on /ws"
  );

  return wss;
}












