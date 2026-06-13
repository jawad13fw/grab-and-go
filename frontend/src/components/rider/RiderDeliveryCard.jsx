import Button from '../common/Button';
import RatingStars from '../common/RatingStars';

const RiderDeliveryCard = ({ order, shop, productSummary }) => {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-primary">{order.status}</p>
          <h4 className="text-lg font-semibold text-slate-900">{shop?.name}</h4>
          <p className="text-sm text-slate-500">{shop?.address}</p>
        </div>
        <RatingStars rating={shop?.rating || 4.5} />
      </div>
      <p className="text-sm text-slate-500">{productSummary}</p>
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>Customer: {order.customer?.name}</span>
        <span>Total: Rs. {order.total}</span>
      </div>
      <Button className="w-full">Mark as Delivered</Button>
    </div>
  );
};

export default RiderDeliveryCard;
