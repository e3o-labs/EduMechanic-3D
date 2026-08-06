'use client';

import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { PinItem, CommentData } from '../types';
import { useStore } from '../store/useStore';

export function useYjsSync(roomName: string = 'edumechanic-room-b') {
  const [doc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<number>(4);

  const addPin = useStore((s) => s.addPin);
  const addComment = useStore((s) => s.addComment);

  useEffect(() => {
    // Connect to WebSocket Yjs provider (with fallback to public ws server or local)
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://demos.yjs.dev';
    const wsProvider = new WebsocketProvider(wsUrl, roomName, doc);
    setProvider(wsProvider);

    const yPins = doc.getArray<PinItem>('pins');
    const yComments = doc.getArray<CommentData>('comments');

    // Observe remote changes
    yPins.observe((event) => {
      event.changes.added.forEach((item) => {
        const pin = item.content.getContent()[0] as PinItem;
        if (pin) {
          addPin(pin);
        }
      });
    });

    yComments.observe((event) => {
      event.changes.added.forEach((item) => {
        const comment = item.content.getContent()[0] as CommentData;
        if (comment) {
          addComment(comment);
        }
      });
    });

    // Awareness tracking for live active members
    wsProvider.awareness.on('change', () => {
      const states = wsProvider.awareness.getStates();
      setConnectedUsers(Math.max(1, states.size));
    });

    return () => {
      wsProvider.destroy();
    };
  }, [doc, roomName, addPin, addComment]);

  const syncNewPin = (pin: PinItem) => {
    const yPins = doc.getArray<PinItem>('pins');
    yPins.push([pin]);
  };

  const syncNewComment = (comment: CommentData) => {
    const yComments = doc.getArray<CommentData>('comments');
    yComments.push([comment]);
  };

  return {
    provider,
    connectedUsers,
    syncNewPin,
    syncNewComment,
  };
}
