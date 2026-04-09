import { Link } from 'react-router-dom';
import RatingStars from '../common/RatingStars';
import { getShopBanner, handleImageError, SHOP_BANNER_FALLBACK } from '../../utils/imageUtils';

const ShopCard = ({ shop }) => (
  <Link
    to={`/shops/${shop.id}`}
    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-primary/10 transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:ring-2"
  >
    <div className="relative aspect-[16/9] w-full overflow-hidden">
      <img
        src={getShopBanner(shop)}
        alt={shop.name}
        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        onError={handleImageError(SHOP_BANNER_FALLBACK)}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80" />
      <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-white">
        <div className="space-y-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/70">
            {shop.category}
          </p>
          <h3 className="line-clamp-2 text-lg font-semibold leading-snug drop-shadow-sm md:text-xl">
            {shop.name}
          </h3>
        </div>
        {shop.eta && (
          <span className="whitespace-nowrap rounded-full bg-black/60 px-3 py-1 text-xs font-medium backdrop-blur">
            {shop.eta}
          </span>
        )}
      </div>
    </div>
    <div className="flex flex-1 flex-col justify-between space-y-3 p-4">
      <div className="space-y-2">
        <RatingStars rating={shop.rating} />
        {shop.description && (
          <p className="text-sm text-slate-500 line-clamp-2">{shop.description}</p>
        )}
      </div>
      {shop.tags?.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-2">
          {shop.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  </Link>
);

export default ShopCard;


