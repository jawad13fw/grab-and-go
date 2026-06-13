import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';

const VendorProductCard = ({ product, onEdit, onDelete }) => (
  <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-primary/10 transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:ring-2">
    <div className="flex items-start gap-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        <img
          src={product.image || product.images?.[0]}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-semibold text-slate-900 md:text-base line-clamp-1">{product.name}</h4>
        {product.description && (
          <p className="text-xs text-slate-500 line-clamp-2 md:text-sm">{product.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 md:text-sm">
          <span className="font-semibold text-slate-900">
            ₨{Number(product.price).toLocaleString()}
          </span>
          {product.stock != null && (
            <span>{product.stock} in stock</span>
          )}
          {product.category && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[0.7rem] font-medium text-slate-700">
              {product.category}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 self-stretch pl-2">
        <button
          onClick={() => onEdit?.(product)}
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="Edit"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete?.(product.id)}
          className="mt-auto rounded-lg p-1.5 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
);

export default VendorProductCard;
