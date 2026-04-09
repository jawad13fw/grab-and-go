const RatingStars = ({ rating = 4.5 }) => {
  const normalizedRating = Number.isFinite(rating) ? rating : 4.5;
  const stars = new Array(5).fill(0);
  return (
    <div className="flex items-center gap-1 text-amber-500">
      {stars.map((_, index) => (
        <span key={index}>{index < Math.round(normalizedRating) ? '★' : '☆'}</span>
      ))}
      <span className="text-xs text-slate-500">{normalizedRating.toFixed(1)}</span>
    </div>
  );
};

export default RatingStars;

