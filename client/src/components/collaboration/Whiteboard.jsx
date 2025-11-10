import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import './Whiteboard.css';

const Whiteboard = ({ socket, roomId, onClose }) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const isApplyingRemoteRef = useRef(false);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser'
  const [color, setColor] = useState('#ff4757');
  const [size, setSize] = useState(3);

  const throttleRef = useRef({ last: 0, delay: 500 });

  // Initialize fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      backgroundColor: '#ffffff',
      selection: false,
    });
    fabricCanvasRef.current = canvas;

    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.width = size;
    canvas.freeDrawingBrush.color = color;

    const resize = () => {
      const parent = canvasRef.current.parentElement;
      if (!parent) return;
      const w = Math.min(parent.clientWidth, 1200);
      const h = Math.min(parent.clientHeight, 800);
      canvas.setWidth(w);
      canvas.setHeight(h);
      canvas.renderAll();
    };
    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // Join whiteboard room and set up socket events
  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit('whiteboard-join', { roomId });

    const handleSync = ({ json }) => {
      if (!fabricCanvasRef.current || !json) return;
      isApplyingRemoteRef.current = true;
      fabricCanvasRef.current.loadFromJSON(json, () => {
        isApplyingRemoteRef.current = false;
        fabricCanvasRef.current.renderAll();
      });
    };

    const handleCleared = () => {
      if (!fabricCanvasRef.current) return;
      isApplyingRemoteRef.current = true;
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.setBackgroundColor('#ffffff', () => {
        isApplyingRemoteRef.current = false;
        fabricCanvasRef.current.renderAll();
      });
    };

    socket.on('whiteboard-sync', handleSync);
    socket.on('whiteboard-cleared', handleCleared);

    return () => {
      socket.off('whiteboard-sync', handleSync);
      socket.off('whiteboard-cleared', handleCleared);
    };
  }, [socket, roomId]);

  // Broadcast updates (throttled)
  const broadcastUpdate = useCallback(() => {
    const now = Date.now();
    if (now - throttleRef.current.last < throttleRef.current.delay) return;
    throttleRef.current.last = now;

    if (!fabricCanvasRef.current || !socket) return;
    if (isApplyingRemoteRef.current) return; // avoid echo

    const json = fabricCanvasRef.current.toJSON();
    socket.emit('whiteboard-update', { roomId, json });
  }, [socket, roomId]);

  // Listen to canvas changes to broadcast
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    const onPathCreated = () => broadcastUpdate();
    const onObjectModified = () => broadcastUpdate();

    canvas.on('path:created', onPathCreated);
    canvas.on('object:modified', onObjectModified);
    canvas.on('object:added', onObjectModified);

    return () => {
      canvas.off('path:created', onPathCreated);
      canvas.off('object:modified', onObjectModified);
      canvas.off('object:added', onObjectModified);
    };
  }, [broadcastUpdate]);

  // Tool/color/size changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;

    if (tool === 'pen') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.width = size;
      canvas.freeDrawingBrush.color = color;
    } else if (tool === 'eraser') {
      canvas.isDrawingMode = true;
      // Eraser effect: draw with white over the canvas
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.width = size + 4;
      canvas.freeDrawingBrush.color = '#ffffff';
    }
    canvas.renderAll();
  }, [tool, color, size]);

  const clearBoard = () => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.clear();
    fabricCanvasRef.current.setBackgroundColor('#ffffff', () => {
      fabricCanvasRef.current.renderAll();
      if (socket) socket.emit('whiteboard-clear', { roomId });
    });
  };

  return (
    <div className="whiteboard-overlay">
      <div className="whiteboard-container">
        <div className="whiteboard-toolbar">
          <div className="tool-group">
            <button className={`tool-btn ${tool==='pen'?'active':''}`} onClick={() => setTool('pen')}>Pen</button>
            <button className={`tool-btn ${tool==='eraser'?'active':''}`} onClick={() => setTool('eraser')}>Eraser</button>
          </div>
          <div className="tool-group">
            <label className="label">Color</label>
            <input type="color" value={color} onChange={(e)=>setColor(e.target.value)} />
          </div>
          <div className="tool-group">
            <label className="label">Size</label>
            <input type="range" min="1" max="32" value={size} onChange={(e)=>setSize(parseInt(e.target.value,10))} />
          </div>
          <div className="tool-group">
            <button className="btn-secondary" onClick={clearBoard}>Clear</button>
            <button className="btn-error" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="whiteboard-canvas-wrapper">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
