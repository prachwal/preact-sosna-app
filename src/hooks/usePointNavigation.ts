import { useState } from 'preact/hooks';
import type { Point } from '../types/types';

export function usePointNavigation(points: Point[]) {
  const [currentPointIndex, setCurrentPointIndex] = useState<number>(-1);
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);

  const navigateToPoint = (point: Point | null) => {
    if (point && points.length > 0) {
      const index = points.findIndex(p => p.id === point.id);
      setCurrentPointIndex(index);
    } else {
      setCurrentPointIndex(-1);
    }
    setSelectedPoint(point);
  };

  const navigateToPrevious = () => {
    if (currentPointIndex > 0) {
      const newIndex = currentPointIndex - 1;
      const point = points[newIndex];
      if (point) {
        setCurrentPointIndex(newIndex);
        setSelectedPoint(point);
      }
    }
  };

  const navigateToNext = () => {
    if (currentPointIndex < points.length - 1) {
      const newIndex = currentPointIndex + 1;
      const point = points[newIndex];
      if (point) {
        setCurrentPointIndex(newIndex);
        setSelectedPoint(point);
      }
    }
  };

  const closePointNavigation = () => {
    setCurrentPointIndex(-1);
    setSelectedPoint(null);
  };

  const hasPrevious = currentPointIndex > 0;
  const hasNext = currentPointIndex < points.length - 1;

  return {
    currentPointIndex,
    selectedPoint,
    navigateToPoint,
    navigateToPrevious,
    navigateToNext,
    closePointNavigation,
    hasPrevious,
    hasNext,
  };
}