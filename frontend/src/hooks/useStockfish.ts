'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function useStockfish() {
  const [depth, setDepth] = useState(10);
  const [evaluation, setEvaluation] = useState<string>('0.00');
  const [bestMove, setBestMove] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  // Initialize Stockfish worker
  useEffect(() => {
    // Check if worker is supported
    if (typeof window !== 'undefined' && window.Worker) {
      try {
        // Load Stockfish from a CDN in a Web Worker
        const stockfishUrl = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';
        const blobCode = `importScripts("${stockfishUrl}");`;
        const blob = new Blob([blobCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));

        worker.onmessage = (e) => {
          const line = e.data;
          
          if (line.includes('info depth')) {
            // Parse evaluation: e.g. "info depth 10 seldepth 10 score cp 35 nodes 2394 nps..."
            const scoreMatch = line.match(/score cp (-?\d+)/);
            if (scoreMatch) {
              const cp = parseInt(scoreMatch[1], 10);
              const scoreVal = (cp / 100).toFixed(2);
              setEvaluation(scoreVal);
            }
            
            const mateMatch = line.match(/score mate (-?\d+)/);
            if (mateMatch) {
              setEvaluation(`M${mateMatch[1]}`);
            }
          }

          if (line.startsWith('bestmove')) {
            // Parse bestmove: e.g. "bestmove e2e4 ponder e7e5"
            const parts = line.split(' ');
            if (parts.length >= 2) {
              setBestMove(parts[1]);
              setIsAnalyzing(false);
            }
          }
        };

        workerRef.current = worker;
        worker.postMessage('uci');
      } catch (err) {
        console.warn('Could not initialize Stockfish Web Worker. Falling back to local solver simulator.', err);
      }
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const analyzePosition = useCallback((fen: string) => {
    setIsAnalyzing(true);
    setBestMove('');
    
    if (workerRef.current) {
      workerRef.current.postMessage('stop');
      workerRef.current.postMessage(`position fen ${fen}`);
      workerRef.current.postMessage(`go depth ${depth}`);
    } else {
      // Simulate evaluation for development / offline fallback
      setTimeout(() => {
        // Simple deterministic evaluation simulation based on FEN string length
        const cpVal = ((fen.length % 20) - 10) / 4;
        setEvaluation(cpVal.toFixed(2));
        
        // Mock a reasonable move suggestion
        const moveSim = fen.includes('w') ? 'e2e4' : 'e7e5';
        setBestMove(moveSim);
        setIsAnalyzing(false);
      }, 800);
    }
  }, [depth]);

  return {
    evaluation,
    bestMove,
    isAnalyzing,
    analyzePosition,
    depth,
    setDepth,
  };
}
