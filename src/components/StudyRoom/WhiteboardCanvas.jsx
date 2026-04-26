import { useRef, useCallback, useEffect, useState } from "react";
import {
  Excalidraw,
  sceneCoordsToViewportCoords,
  viewportCoordsToSceneCoords,
} from "@excalidraw/excalidraw";
import { motion } from "framer-motion";
import {
  Pencil,
  Square,
  Type,
  Eraser,
  MousePointer2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { useLiveCanvas } from "./useLiveCanvas";
import { useRoomPresence } from "./useStudyRoom";
import { Button } from "../ui/button";

const TOOLS = [
  { tool: "selection", Icon: MousePointer2 },
  { tool: "freedraw", Icon: Pencil },
  { tool: "rectangle", Icon: Square },
  { tool: "text", Icon: Type },
  { tool: "eraser", Icon: Eraser },
];

export default function WhiteboardCanvas({ canvasApiRef }) {
  const apiRef = useRef(null);
  const [appState, setAppState] = useState(null);
  const {
    initialData,
    onChange,
    setExcalidrawAPI,
    addElements,
  } = useLiveCanvas();
  const { others, updateMyPresence, getColorForUserId } = useRoomPresence();

  useEffect(() => {
    if (!canvasApiRef) return;
    canvasApiRef.current = {
      addElements,
      getViewport: () => {
        const api = apiRef.current;
        const state = api?.getAppState?.();
        if (!state) return { scrollX: 0, scrollY: 0, width: 800, height: 600 };
        return {
          scrollX: state.scrollX ?? 0,
          scrollY: state.scrollY ?? 0,
          width: state.width ?? 800,
          height: state.height ?? 600,
        };
      },
    };
    return () => {
      if (canvasApiRef) canvasApiRef.current = { addElements: null, getViewport: null };
    };
  }, [addElements, canvasApiRef]);

  const handleChange = useCallback(
    (elements, state) => {
      setAppState(state);
      onChange(elements, state);
    },
    [onChange]
  );

  const handlePointerUpdate = useCallback(
    (payload) => {
      if (!payload?.pointer) return;
      const api = apiRef.current;
      const state = api?.getAppState?.();
      if (!state) {
        updateMyPresence({ cursor: { x: payload.pointer.x, y: payload.pointer.y } });
        return;
      }
      const { zoom, offsetLeft, offsetTop, scrollX, scrollY } = state;
      const scene = viewportCoordsToSceneCoords(
        { clientX: payload.pointer.x, clientY: payload.pointer.y },
        { zoom, offsetLeft, offsetTop, scrollX, scrollY }
      );
      updateMyPresence({ cursor: { x: scene.x, y: scene.y } });
    },
    [updateMyPresence]
  );

  const handleExcalidrawAPI = useCallback(
    (api) => {
      apiRef.current = api;
      setExcalidrawAPI(api);
      if (api?.getAppState) setAppState(api.getAppState());
    },
    [setExcalidrawAPI]
  );

  const setTool = useCallback((tool) => {
    const api = apiRef.current;
    if (api?.getAppState) {
      api.updateScene({
        appState: { ...api.getAppState(), activeTool: { type: tool, customType: null } },
      });
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    const api = apiRef.current;
    if (api?.getAppState) {
      const state = api.getAppState();
      api.updateScene({
        appState: {
          ...state,
          zoom: {
            value: Math.min(3, (state.zoom?.value ?? 1) * 1.1),
            translation: state.zoom?.translation ?? { x: 0, y: 0 },
          },
        },
      });
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    const api = apiRef.current;
    if (api?.getAppState) {
      const state = api.getAppState();
      api.updateScene({
        appState: {
          ...state,
          zoom: {
            value: Math.max(0.1, (state.zoom?.value ?? 1) / 1.1),
            translation: state.zoom?.translation ?? { x: 0, y: 0 },
          },
        },
      });
    }
  }, []);

  const handleResetView = useCallback(() => {
    const api = apiRef.current;
    if (api?.getAppState) {
      const state = api.getAppState();
      api.updateScene({
        appState: {
          ...state,
          scrollX: 0,
          scrollY: 0,
          zoom: { value: 1, translation: { x: 0, y: 0 } },
        },
      });
    }
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 p-1 rounded-lg bg-card/90 border border-border shadow-lg">
        {TOOLS.map(({ tool, Icon }) => (
          <Button
            key={tool}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTool(tool)}
            title={tool}
          >
            <Icon className="w-4 h-4" />
          </Button>
        ))}
        <div className="w-px h-5 bg-border mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn} title="Zoom in">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut} title="Zoom out">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleResetView} title="Reset view">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 relative min-h-0">
        <Excalidraw
          theme="dark"
          gridModeEnabled
          initialData={initialData}
          onChange={handleChange}
          excalidrawAPI={handleExcalidrawAPI}
          onPointerUpdate={handlePointerUpdate}
          UIOptions={{
            canvasActions: {
              export: false,
              saveToActiveFile: false,
              loadScene: false,
              saveAsImage: false,
              toggleTheme: false,
              clearCanvas: true,
              changeViewBackgroundColor: true,
            },
          }}
        />

        <RemoteCursors others={others} getColorForUserId={getColorForUserId} appState={appState} />
      </div>
    </div>
  );
}

function RemoteCursors({ others, getColorForUserId, appState }) {
  if (!appState?.zoom) return null;
  const viewport = {
    zoom: appState.zoom,
    offsetLeft: appState.offsetLeft ?? 0,
    offsetTop: appState.offsetTop ?? 0,
    scrollX: appState.scrollX ?? 0,
    scrollY: appState.scrollY ?? 0,
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 10 }}
    >
      {others.map((user) => {
        const cursor = user.presence?.cursor;
        if (!cursor) return null;
        try {
          const { x, y } = sceneCoordsToViewportCoords(
            { sceneX: cursor.x, sceneY: cursor.y },
            viewport
          );
          const color = user.presence?.color || getColorForUserId(user.connectionId?.toString());
          const name = user.presence?.name || "User";
          return (
            <motion.div
              key={user.connectionId}
              className="absolute flex flex-col items-center"
              style={{
                left: x,
                top: y,
                transform: "translate(-2px, -2px)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-[var(--text-primary)] shadow-md"
                style={{ backgroundColor: color }}
              />
              <span
                className="text-sm md:text-xs font-medium px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap bg-card border border-border shadow"
                style={{ color }}
              >
                {name}
              </span>
            </motion.div>
          );
        } catch (e) {
          return null;
        }
      })}
    </div>
  );
}
