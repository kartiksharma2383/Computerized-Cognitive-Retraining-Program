import React, { useState, useEffect, useCallback } from 'react';

// Sudoku generator logic
const generateSudoku = (difficulty) => {
  const emptyCounts = { Easy: 30, Medium: 45, Hard: 55 };
  const emptyCount = emptyCounts[difficulty] || 30;

  const board = Array(9).fill().map(() => Array(9).fill(0));
  
  const isValid = (board, row, col, num) => {
    for (let i = 0; i < 9; i++) {
      if (board[row][i] === num) return false;
      if (board[i][col] === num) return false;
      const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
      const boxCol = 3 * Math.floor(col / 3) + i % 3;
      if (board[boxRow][boxCol] === num) return false;
    }
    return true;
  };
  
  const solve = (board) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
          for (let num of nums) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              if (solve(board)) return true;
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };
  
  // Fill diagonal boxes first to add randomness efficiently
  for(let i=0; i<9; i=i+3) {
      const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
      let idx = 0;
      for(let r=0; r<3; r++) {
          for(let c=0; c<3; c++) {
              board[i+r][i+c] = nums[idx++];
          }
      }
  }
  solve(board);
  const solution = board.map(row => [...row]);
  
  // Remove cells
  let count = emptyCount;
  const puzzle = board.map(row => [...row]);
  while (count > 0) {
    let row = Math.floor(Math.random() * 9);
    let col = Math.floor(Math.random() * 9);
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      count--;
    }
  }
  
  // Convert puzzle to state representation
  const initialBoard = puzzle.map(row => 
    row.map(val => ({
      value: val,
      isInitial: val !== 0,
      isError: false
    }))
  );
  
  return { solution, initialBoard };
};

export default function SudokuGame() {
  const [difficulty, setDifficulty] = useState('Easy');
  const [board, setBoard] = useState(null);
  const [solution, setSolution] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [isWon, setIsWon] = useState(false);

  const startNewGame = useCallback(() => {
    const { solution: newSol, initialBoard } = generateSudoku(difficulty);
    setSolution(newSol);
    setBoard(initialBoard);
    setSelectedCell(null);
    setIsWon(false);
  }, [difficulty]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const checkWin = (currentBoard) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c].value !== solution[r][c]) {
          return false;
        }
      }
    }
    return true;
  };

  const handleCellClick = (r, c) => {
    if (board[r][c].isInitial || isWon) return;
    setSelectedCell({ r, c });
  };

  const handleInput = useCallback((num) => {
    if (!selectedCell || isWon || !board) return;
    const { r, c } = selectedCell;
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    newBoard[r][c].value = num;
    
    // Check conflicts (simple row/col/box check)
    // Clear all errors first
    for(let i=0; i<9; i++) {
        for(let j=0; j<9; j++) {
            newBoard[i][j].isError = false;
        }
    }
    
    // Find all conflicts
    for(let i=0; i<9; i++) {
        for(let j=0; j<9; j++) {
            const val = newBoard[i][j].value;
            if(val === 0) continue;
            // Check row
            for(let x=0; x<9; x++) {
                if(x !== j && newBoard[i][x].value === val) {
                    newBoard[i][j].isError = true;
                    newBoard[i][x].isError = true;
                }
            }
            // Check col
            for(let y=0; y<9; y++) {
                if(y !== i && newBoard[y][j].value === val) {
                    newBoard[i][j].isError = true;
                    newBoard[y][j].isError = true;
                }
            }
            // Check box
            const boxRow = 3 * Math.floor(i / 3);
            const boxCol = 3 * Math.floor(j / 3);
            for(let y=0; y<3; y++) {
                for(let x=0; x<3; x++) {
                    const r2 = boxRow + y;
                    const c2 = boxCol + x;
                    if((r2 !== i || c2 !== j) && newBoard[r2][c2].value === val) {
                        newBoard[i][j].isError = true;
                        newBoard[r2][c2].isError = true;
                    }
                }
            }
        }
    }
    
    setBoard(newBoard);
    
    if (checkWin(newBoard)) {
      setIsWon(true);
      setSelectedCell(null);
    }
  }, [selectedCell, board, isWon]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if(e.key >= '1' && e.key <= '9') {
        handleInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleInput(0);
      } else if (e.key.startsWith('Arrow') && selectedCell) {
          let {r, c} = selectedCell;
          if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
          if (e.key === 'ArrowDown') r = Math.min(8, r + 1);
          if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
          if (e.key === 'ArrowRight') c = Math.min(8, c + 1);
          
          if(!board[r][c].isInitial) setSelectedCell({r, c});
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput, selectedCell, board]);

  if (!board) return null;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '20px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        maxWidth: '100%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <h1 style={{ margin: 0, color: '#1e293b', fontSize: '28px', fontWeight: '800' }}>Sudoku</h1>
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f1f5f9',
              fontSize: '16px',
              fontWeight: '600',
              color: '#334155',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="Easy">Standard (Easy)</option>
            <option value="Medium">Hard (Medium)</option>
            <option value="Hard">Expert (Hard)</option>
          </select>
        </div>

        <div style={{ position: 'relative' }}>
          {isWon && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              borderRadius: '8px'
            }}>
              <h2 style={{ color: '#10b981', fontSize: '32px', margin: '0 0 16px 0', textShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' }}>
                You Won! 🎊
              </h2>
              <button 
                onClick={startNewGame}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)',
                  transition: 'transform 0.1s, background-color 0.2s'
                }}
                onMouseOver={e => e.target.style.backgroundColor = '#2563eb'}
                onMouseOut={e => e.target.style.backgroundColor = '#3b82f6'}
                onMouseDown={e => e.target.style.transform = 'scale(0.95)'}
                onMouseUp={e => e.target.style.transform = 'scale(1)'}
              >
                Play Again
              </button>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(9, 1fr)',
            border: '3px solid #1e293b',
            borderRadius: '8px',
            backgroundColor: '#1e293b',
            gap: '1px',
            width: 'min(90vw, 450px)',
            height: 'min(90vw, 450px)'
          }}>
            {board.map((row, r) => row.map((cell, c) => {
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              
              const borderBottom = r === 8 ? 'none' : (r === 2 || r === 5) ? '3px solid #1e293b' : '1px solid #cbd5e1';
              const borderRight = c === 8 ? 'none' : (c === 2 || c === 5) ? '3px solid #1e293b' : '1px solid #cbd5e1';
              
              const isRelated = selectedCell && (selectedCell.r === r || selectedCell.c === c || 
                (Math.floor(selectedCell.r / 3) === Math.floor(r / 3) && Math.floor(selectedCell.c / 3) === Math.floor(c / 3)));
              
              let bgColor = 'white';
              if (isSelected) bgColor = '#bfdbfe';
              else if (cell.isError) bgColor = '#fecdd3';
              else if (isRelated) bgColor = '#f1f5f9';

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  style={{
                    backgroundColor: bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(16px, 6vw, 24px)',
                    fontWeight: cell.isInitial ? '700' : '500',
                    color: cell.isInitial ? '#1e293b' : (cell.isError ? '#e11d48' : '#3b82f6'),
                    cursor: cell.isInitial ? 'default' : 'pointer',
                    userSelect: 'none',
                    borderBottom,
                    borderRight,
                    transition: 'background-color 0.1s'
                  }}
                >
                  {cell.value || ''}
                </div>
              );
            }))}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '450px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
              <button
                key={num}
                onClick={() => handleInput(num)}
                style={{
                  padding: '12px 0',
                  fontSize: '20px',
                  fontWeight: '600',
                  color: num === 0 ? '#ef4444' : '#334155',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px -1px rgba(0,0,0,0.05)',
                  transition: 'background-color 0.1s, transform 0.1s'
                }}
                onMouseOver={e => e.target.style.backgroundColor = '#e2e8f0'}
                onMouseOut={e => e.target.style.backgroundColor = '#f1f5f9'}
                onMouseDown={e => e.target.style.transform = 'scale(0.95)'}
                onMouseUp={e => e.target.style.transform = 'scale(1)'}
              >
                {num === 0 ? '⌫' : num}
              </button>
            ))}
          </div>
          
          <button 
            onClick={startNewGame}
            style={{
              padding: '16px',
              backgroundColor: '#334155',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={e => e.target.style.backgroundColor = '#1e293b'}
            onMouseOut={e => e.target.style.backgroundColor = '#334155'}
          >
            New Game
          </button>
        </div>

      </div>
    </div>
  );
}
