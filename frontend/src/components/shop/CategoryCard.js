import { Link } from 'react-router-dom';
import { getCategoryImage } from '../../utils/imageUtils';

const CategoryCard = ({ category }) => (
  <Link
    to={`/shops?category=${category.id}`}
    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-primary/10 transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:ring-2"
  >
    <div
      className="relative h-32 bg-cover bg-center sm:h-36"
      style={{ backgroundImage: `url(${getCategoryImage(category.id, category.image)})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80 group-hover:opacity-90" />
      <div className="absolute inset-x-4 bottom-3 flex items-center justify-between text-white">
        <h4 className="text-sm font-semibold md:text-base drop-shadow-sm">{category.name}</h4>
        {category.shopCount > 0 && (
          <span className="rounded-full bg-black/60 px-2.5 py-1 text-[0.7rem] font-medium backdrop-blur">
            {category.shopCount} shop{category.shopCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
    <div className="space-y-2 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary/80">
        Category
      </p>
      <p className="text-sm text-slate-500 line-clamp-2">
        {category.description || `Browse ${category.name} shops and products`}
      </p>
      <p className="mt-1 text-xs font-semibold text-primary">
        Explore shops <span aria-hidden="true">-></span>
      </p>
    </div>
  </Link>
);

export default CategoryCard;


