import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MOCK_PRODUCTS } from '../api/mockData';
import { useCartStore } from '../store/useCartStore';
import { useToastStore } from '../store/useToastStore';
import { ProductCard } from '../components/ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { addToast } = useToastStore();

  const product = MOCK_PRODUCTS.find((p) => p.id === id) || MOCK_PRODUCTS[0];

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('400053');
  const [pincodeChecked, setPincodeChecked] = useState(true);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews'>('specs');
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    if (product.stock <= 0) return;
    addToCart(product, quantity);
    setIsAdded(true);
    addToast({
      type: 'success',
      title: 'Added to Cart',
      message: `${quantity}x ${product.name.slice(0, 36)} added to your cart.`
    });
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleBuyNow = () => {
    if (product.stock <= 0) return;
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length === 6) {
      setPincodeChecked(true);
      addToast({
        type: 'success',
        title: 'Delivery Available',
        message: `Express delivery available to pincode ${pincode}`
      });
    } else {
      addToast({
        type: 'error',
        title: 'Invalid Pincode',
        message: 'Please enter a valid 6-digit Indian pincode.'
      });
    }
  };

  const relatedProducts = MOCK_PRODUCTS.filter(
    (p) => p.id !== product.id && p.category === product.category
  ).slice(0, 4);

  return (
    <div className="bg-[#FAF8FF] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto scrollbar-none py-1">
          <Link to="/" className="hover:text-indigo-600 font-medium">
            Home
          </Link>
          <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
          <Link to="/" className="hover:text-indigo-600 font-medium">
            Electronics
          </Link>
          <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
          <span className="text-slate-700 font-semibold truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Main Product Showcase Section */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Column: Image Gallery (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group">
                <img
                  src={product.images[selectedImage] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                {product.discountPercentage > 0 && (
                  <span className="absolute top-4 left-4 bg-rose-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-md">
                    {product.discountPercentage}% OFF
                  </span>
                )}
                <span className="absolute top-4 right-4 bg-indigo-50 text-indigo-700 font-bold text-[11px] px-2.5 py-1 rounded-lg border border-indigo-200">
                  ⚡ Verified Brand
                </span>
              </div>

              {/* Thumbnail Switcher */}
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImage === idx
                        ? 'border-indigo-600 shadow-md scale-95'
                        : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Details & Purchasing (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Header: Brand & Title */}
              <div>
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase">
                    {product.brand}
                  </span>
                  {product.stock > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      In Stock ({product.stock} units available)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Currently Out of Stock
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {product.name}
                </h1>

                {/* Rating & Review Counter */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-extrabold">
                    <span>★</span>
                    <span>{product.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {product.reviewCount.toLocaleString('en-IN')} customer ratings
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">thumb_up</span>
                    94% recommend this item
                  </span>
                </div>
              </div>

              {/* Pricing Block */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-slate-900">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="text-base text-slate-400 line-through">
                      MRP: ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                  {product.discountPercentage > 0 && (
                    <span className="text-xs font-extrabold text-emerald-600">
                      Save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')} (
                      {product.discountPercentage}%)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Inclusive of all taxes. Free shipping on this item.
                </p>
              </div>

              {/* Bank Offers & Coupons Card */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wide">
                  <span className="material-symbols-outlined text-base text-indigo-600">
                    local_offer
                  </span>
                  <span>Available Bank Offers & Discounts</span>
                </div>
                <ul className="space-y-1.5 text-xs text-indigo-950">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>
                      <strong>Bank Offer:</strong> Flat 10% Instant Discount on HDFC & ICICI Credit Cards.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>
                      <strong>Coupon:</strong> Use code <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-indigo-700 border border-indigo-200">UNICART10</code> at checkout for extra savings.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Pincode & Delivery Checker */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Check Delivery Date & Pincode
                </label>
                <form onSubmit={handleCheckPincode} className="flex gap-2 max-w-sm">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit Pincode"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Check
                  </button>
                </form>
                {pincodeChecked && (
                  <p className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-base">local_shipping</span>
                    Delivery by Thursday to {pincode} | Standard Free Shipping
                  </p>
                )}
              </div>

              {/* Quantity Selector & CTAs */}
              <div className="pt-2 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-700">Quantity:</span>
                  <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-xs">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || product.stock <= 0}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 rounded-l-xl"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-xs font-bold text-slate-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock || product.stock <= 0}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 rounded-r-xl"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className={`py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-md ${
                      isAdded
                        ? 'bg-emerald-600 text-white'
                        : product.stock > 0
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/25'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {isAdded ? 'check' : 'shopping_bag'}
                    </span>
                    <span>{isAdded ? 'Added to Cart' : 'Add to Cart'}</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={product.stock <= 0}
                    className="py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-extrabold bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-lg">bolt</span>
                    <span>Buy Now</span>
                  </button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-[11px]">
                  <span className="material-symbols-outlined text-indigo-600 block text-xl mb-1">
                    replay
                  </span>
                  <span>7-Day Replacement</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-[11px]">
                  <span className="material-symbols-outlined text-emerald-600 block text-xl mb-1">
                    verified
                  </span>
                  <span>100% Genuine</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-[11px]">
                  <span className="material-symbols-outlined text-amber-600 block text-xl mb-1">
                    security
                  </span>
                  <span>1 Year Warranty</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications & Reviews Tabs */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="flex border-b border-slate-200 gap-8 mb-6">
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'specs'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Technical Specifications
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'reviews'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Verified Customer Reviews ({product.reviewCount})
            </button>
          </div>

          {activeTab === 'specs' ? (
            <div className="space-y-6">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>

              {product.specifications && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(product.specifications).map(([key, val]) => (
                        <tr key={key} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-bold text-slate-700 bg-slate-50/80 w-1/3">
                            {key}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Overall Rating</h4>
                  <p className="text-xs text-slate-500">Based on 3,840 verified customer purchases</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-amber-600">4.8 / 5.0</span>
                  <p className="text-[11px] text-emerald-600 font-semibold">96% 5-star ratings</p>
                </div>
              </div>

              {/* Sample Review */}
              <div className="p-4 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      A
                    </div>
                    <span className="text-xs font-bold text-slate-900">Amit Verma</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                      Verified Buyer
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">2 days ago</span>
                </div>
                <div className="text-amber-500 text-xs">★★★★★</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Exceptional sound clarity and super comfortable earcups for all-day remote meetings and music. Battery easily lasts more than 2 full days on a single charge. Highly recommended!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900">Similar Products You Might Like</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
