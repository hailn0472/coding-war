import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import type { Contest } from '@/stores/contestStore';

interface ContestTimerProps {
  contest: Contest;
}

export const ContestTimer: React.FC<ContestTimerProps> = ({ contest }) => {
  const [timeRemaining, setTimeRemaining] = useState(
    contest.timeRemaining || 0
  );
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Load saved position from localStorage
    const savedPosition = localStorage.getItem('contest_timer_pos');
    if (savedPosition) {
      const [x, y] = savedPosition.split(':').map(Number);
      setPosition({ x, y });
    }
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newPosition = {
      x: Math.max(0, Math.min(window.innerWidth - 300, e.clientX - 150)),
      y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - 25)),
    };

    setPosition(newPosition);
    localStorage.setItem(
      'contest_timer_pos',
      `${newPosition.x}:${newPosition.y}`
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      className="fixed z-50 cursor-move select-none rounded-md bg-primary-600 px-4 py-2 text-white shadow-lg"
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <Link
        to={`/contest/${contest.key}`}
        className="flex items-center space-x-2 hover:text-primary-100"
      >
        <Clock className="h-4 w-4" />
        <span className="font-medium">{contest.name}</span>
        <span>-</span>
        {contest.isSpectating ? (
          <span>spectating</span>
        ) : contest.isVirtual ? (
          <span>virtual</span>
        ) : (
          <span className="font-mono">{formatTime(timeRemaining)}</span>
        )}
      </Link>
    </div>
  );
};
