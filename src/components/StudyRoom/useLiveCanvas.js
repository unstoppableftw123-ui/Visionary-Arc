import { useRef, useEffect, useCallback, useState } from "react";
import * as Y from "yjs";
import { useRoom } from "../../liveblocks.config";
import { getYjsProviderForRoom } from "@liveblocks/yjs";

const SCENE_KEY = "scene";

/**
 * Sync Excalidraw canvas state with Liveblocks room via Yjs.
 * Returns initialData for Excalidraw, onChange handler, and setExcalidrawAPI.
 * Must be used inside RoomProvider.
 */
export function useLiveCanvas() {
  const room = useRoom();
  const [initialData, setInitialData] = useState(null);
  const excalidrawAPIRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);
  const yDocRef = useRef(null);
  const yMapRef = useRef(null);

  useEffect(() => {
    if (!room) return;

    const yProvider = getYjsProviderForRoom(room);
    const yDoc = yProvider.getYDoc();
    yDocRef.current = yDoc;

    const yMap = yDoc.getMap(SCENE_KEY);
    yMapRef.current = yMap;

    const stored = yMap.get("data");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setInitialData({
          elements: parsed.elements ?? [],
          appState: parsed.appState ?? {},
        });
      } catch (e) {
        setInitialData({ elements: [], appState: {} });
      }
    } else {
      setInitialData({ elements: [], appState: {} });
    }

    const observer = () => {
      const raw = yMap.get("data");
      if (!raw || !excalidrawAPIRef.current) return;
      isRemoteUpdateRef.current = true;
      try {
        const parsed = JSON.parse(raw);
        excalidrawAPIRef.current.updateScene({
          elements: parsed.elements ?? [],
          appState: parsed.appState ?? {},
        });
      } catch (e) {
        // ignore parse errors
      } finally {
        isRemoteUpdateRef.current = false;
      }
    };

    yMap.observe(observer);

    return () => {
      yMap.unobserve(observer);
      yDocRef.current = null;
      yMapRef.current = null;
    };
  }, [room]);

  const onChange = useCallback((elements, appState) => {
    if (isRemoteUpdateRef.current) return;
    const yMap = yMapRef.current;
    if (!yMap) return;
    isRemoteUpdateRef.current = true;
    try {
      const data = JSON.stringify({
        elements: elements.map((el) => ({ ...el })),
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          gridSize: appState.gridSize,
          zoom: appState.zoom,
          scrollX: appState.scrollX,
          scrollY: appState.scrollY,
        },
      });
      yMap.set("data", data);
    } finally {
      isRemoteUpdateRef.current = false;
    }
  }, []);

  const setExcalidrawAPI = useCallback((api) => {
    excalidrawAPIRef.current = api;
  }, []);

  /** Add elements to the canvas (e.g. library cards) and sync to Yjs */
  const addElements = useCallback((newElements) => {
    const api = excalidrawAPIRef.current;
    const yMap = yMapRef.current;
    if (!api || !yMap) return;
    const scene = api.getSceneElements();
    const next = [...scene, ...newElements];
    const appState = api.getAppState();
    isRemoteUpdateRef.current = true;
    try {
      api.updateScene({ elements: next });
      const data = JSON.stringify({
        elements: next.map((el) => ({ ...el })),
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          gridSize: appState.gridSize,
          zoom: appState.zoom,
          scrollX: appState.scrollX,
          scrollY: appState.scrollY,
        },
      });
      yMap.set("data", data);
    } finally {
      isRemoteUpdateRef.current = false;
    }
  }, []);

  return {
    initialData,
    onChange,
    setExcalidrawAPI,
    addElements,
  };
}
