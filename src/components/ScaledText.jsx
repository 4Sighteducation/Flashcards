import React, { useRef, useEffect } from 'react';
import './ScaledText.css';

/**
 * Component that automatically scales text to fit within its container
 * @param {Object} props
 * @param {React.ReactNode} props.children - The text content to scale
 * @param {number} props.minFontSize - Minimum font size in pixels (default: 6)
 * @param {number} props.maxFontSize - Maximum font size in pixels (default: 16)
 * @param {string} props.className - Additional CSS class names
 */
const ScaledText = ({ children, minFontSize = 6, maxFontSize = 16, className = '' }) => {
  const textRef = useRef(null);
  const containerRef = useRef(null);
  
  useEffect(() => {
    // Initial render - wait for next frame for proper sizes
    const timer = requestAnimationFrame(() => {
      adjustTextSize();
    });
    
    return () => cancelAnimationFrame(timer);
  }, [children]);
  
  // Add resize listener
  useEffect(() => {
    window.addEventListener('resize', adjustTextSize);
    return () => window.removeEventListener('resize', adjustTextSize);
  }, []);
  
  const adjustTextSize = () => {
    if (!textRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const text = textRef.current;
    
    // Reset font size to maximum to measure properly
    text.style.fontSize = `${maxFontSize}px`;
    
    // Check if overflowing (both width and height)
    if (text.scrollHeight > container.clientHeight || text.scrollWidth > container.clientWidth) {
      // Binary search to find the right size
      let min = minFontSize;
      let max = maxFontSize;
      
      while (min <= max) {
        const mid = Math.floor((min + max) / 2);
        text.style.fontSize = `${mid}px`;
        
        if (text.scrollHeight <= container.clientHeight && text.scrollWidth <= container.clientWidth) {
          min = mid + 1;
        } else {
          max = mid - 1;
        }
      }
      
      // Final adjustment
      text.style.fontSize = `${max}px`;
      
      // If still overflowing at minimum size, add ellipsis
      if (max <= minFontSize && (text.scrollHeight > container.clientHeight || text.scrollWidth > container.clientWidth)) {
        text.style.overflow = 'hidden';
        text.style.textOverflow = 'ellipsis';
      }
    }
  };
  
  return (
    <div ref={containerRef} className={`text-container ${className}`}>
      <div ref={textRef} className="scaled-text">
        {children}
      </div>
    </div>
  );
};

export default ScaledText; 