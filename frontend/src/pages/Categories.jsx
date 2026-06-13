import { useEffect, useState } from 'react';
import CategoryCard from '../components/shop/CategoryCard';
import Loader from '../components/common/Loader';
import { catalogApi } from '../api/endpoints';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([catalogApi.getCategories(), catalogApi.getShops()])
      .then(([cats, shopsData]) => {
        // API returns { shops: [...] } or plain array
        const allShops = Array.isArray(shopsData) ? shopsData : (shopsData?.shops || []);
        setShops(allShops);
        
        // Get unique categories that have at least one shop
        const categoriesWithShops = new Set(allShops.map(shop => shop.category));
        
        // Show all categories — mark which ones have shops
        const allCategories = Array.isArray(cats) ? cats : (cats?.categories || []);
        setCategories(allCategories);
      })
      .catch(() => {
        setCategories([]);
        setShops([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading..." />;

  // Get shop count for each category
  const getShopCount = (categoryId) => {
    return shops.filter(shop => shop.category === categoryId || shop.category === categoryId).length;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">Browse</p>
        <h2 className="text-3xl font-semibold text-slate-900">Shop Categories</h2>
        <p className="text-slate-500">Explore categories with available shops</p>
      </div>
      {categories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-lg font-semibold text-slate-900">No categories available</p>
          <p className="mt-2 text-slate-500">Check back later for new shops</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard 
              key={category.id} 
              category={{...category, shopCount: getShopCount(category.id)}} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;
