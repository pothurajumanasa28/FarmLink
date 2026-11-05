import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, onChange = null, maxStars = 5, size = 18 }) {
  const isInteractive = typeof onChange === 'function';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      {Array.from({ length: maxStars }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= rating;

        return (
          <button
            key={index}
            type="button"
            disabled={!isInteractive}
            onClick={() => isInteractive && onChange(starValue)}
            style={{
              background: 'none',
              border: 'none',
              padding: '1px',
              cursor: isInteractive ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Star
              size={size}
              fill={isFilled ? '#eab308' : 'none'}
              color={isFilled ? '#eab308' : '#cbd5e1'}
            />
          </button>
        );
      })}
    </div>
  );
}
