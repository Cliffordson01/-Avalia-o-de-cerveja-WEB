import { useState } from 'react'
import { Star } from 'lucide-react'

const StarRating = ({ 
  rating = 0, 
  onRatingChange, 
  maxRating = 5, 
  size = 'md',
  readonly = false,
  showValue = true,
  className = ""
}) => {
  const [hoverRating, setHoverRating] = useState(0)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  }

  const handleClick = (value) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value)
    }
  }

  const handleMouseEnter = (value) => {
    if (!readonly) {
      setHoverRating(value)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0)
    }
  }

  const displayRating = hoverRating || rating

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex items-center space-x-0.5">
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1
          const isFilled = starValue <= displayRating
          const isHalfFilled = starValue - 0.5 <= displayRating && starValue > displayRating

          return (
            <button
              key={index}
              type="button"
              className={`relative transition-all duration-200 ${
                readonly 
                  ? 'cursor-default' 
                  : 'cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 rounded'
              }`}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly}
            >
              <Star
                className={`${sizeClasses[size]} transition-colors duration-200 ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400'
                    : isHalfFilled
                    ? 'text-amber-400 fill-amber-200'
                    : readonly
                    ? 'text-gray-300'
                    : 'text-gray-400 hover:text-amber-300'
                }`}
              />
            </button>
          )
        })}
      </div>
      
      {showValue && (
        <span className={`font-medium ${
          size === 'sm' ? 'text-sm' : 
          size === 'lg' ? 'text-lg' : 
          size === 'xl' ? 'text-xl' : 'text-base'
        } text-amber-700`}>
          {rating > 0 ? rating.toFixed(1) : '0.0'}
        </span>
      )}
    </div>
  )
}

export default StarRating

