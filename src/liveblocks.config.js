/**
 * Liveblocks client and room context for Study Rooms.
 * One client; lobby and study rooms use different room IDs.
 */
import { createClient, LiveList, LiveMap } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const RAW_KEY = process.env.REACT_APP_LIVEBLOCKS_PUBLIC_KEY;

// Only treat the key as valid if it actually starts with "pk_"
const PUBLIC_KEY = RAW_KEY && RAW_KEY.startsWith("pk_") ? RAW_KEY : null;

if (!PUBLIC_KEY) {
  console.warn(
    "REACT_APP_LIVEBLOCKS_PUBLIC_KEY is missing or invalid. Study Rooms will not connect."
  );
}

export const client = PUBLIC_KEY
  ? createClient({ publicApiKey: PUBLIC_KEY })
  : null;

/** Room ID for the lobby where room list is stored */
export const LOBBY_ROOM_ID = "study-rooms-lobby";

/** Prefix for study room IDs */
export const STUDY_ROOM_PREFIX = "study-room-";

/** @param {string} roomId - e.g. "room-abc123" → "study-room-room-abc123" */
export function getStudyRoomId(roomId) {
  if (roomId.startsWith(STUDY_ROOM_PREFIX)) return roomId;
  return STUDY_ROOM_PREFIX + roomId;
}

/**
 * Presence shape per user in a room.
 * @typedef {Object} StudyRoomPresence
 * @property {string} userId
 * @property {string} name
 * @property {string} avatar
 * @property {{ x: number, y: number } | null} cursor
 * @property {string} color
 * @property {boolean} [isTyping]
 */

/**
 * Room metadata in lobby storage.
 * @typedef {Object} RoomMeta
 * @property {string} id
 * @property {string} name
 * @property {string} tag
 * @property {{ id: string, name: string, avatar: string }} createdBy
 * @property {number} memberCount
 * @property {number} maxMembers
 * @property {boolean} isPrivate
 * @property {string[]} [memberIds]
 */

/**
 * Chat message in study room storage.
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {string} userId
 * @property {string} name
 * @property {string} avatar
 * @property {string} text
 * @property {number} createdAt
 */

/**
 * Card metadata for library cards on canvas (owner tracking).
 * @typedef {Object} CardMeta
 * @property {string} userId
 * @property {string} fileId
 */

/** Default presence when entering a room */
export const defaultPresence = {
  userId: "",
  name: "",
  avatar: "",
  cursor: null,
  color: "#a855f7",
  isTyping: false,
};

/** Initial storage for lobby room (room list) */
export function getLobbyInitialStorage() {
  return { rooms: new LiveList([]) };
}

/** Initial storage for a study room (chat + card metadata) */
export function getStudyRoomInitialStorage() {
  return {
    messages: new LiveList([]),
    libraryCards: new LiveMap(),
  };
}

const roomContext = client
  ? createRoomContext(client)
  : {
      RoomProvider: ({ children }) => children,
      useRoom: () => null,
      useStorage: () => null,
      useMutation: () => () => {},
      useOthers: () => [],
      useSelf: () => null,
      useUpdateMyPresence: () => () => {},
      useStatus: () => "closed",
    };

export const {
  RoomProvider,
  useRoom,
  useStorage,
  useMutation,
  useOthers,
  useSelf,
  useUpdateMyPresence,
  useStatus,
} = roomContext;
