import React from 'react';
import { Link } from 'react-router-dom';

const CURRENT_YEAR = 2026;

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Proposition Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0 border border-brand-500/20">
              <span className="material-symbols-outlined text-2xl">local_shipping</span>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Pan-India Express Delivery</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Fast & reliable shipping covering 19,000+ pincodes with live tracking.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <span className="material-symbols-outlined text-2xl">published_with_changes</span>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">7-Day Easy Returns</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Hassle-free doorstep pickup with instant refund initiation to original payment method.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <span className="material-symbols-outlined text-2xl">verified_user</span>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Easy Payments</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Pay with UPI, RuPay, Visa, Mastercard or cash on delivery.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <span className="material-symbols-outlined text-2xl">support_agent</span>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">24/7 Dedicated Support</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Round-the-clock priority customer service via chat and helpline.
              </p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-b border-slate-800 text-sm">
          <div>
            <h5 className="text-white font-semibold mb-4 text-xs tracking-wider uppercase">
              Shop Categories
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Audio & Wearables
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Smartphones & Tablets
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Laptops & Computers
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Keyboards & Peripherals
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Smart Home & IoT
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-4 text-xs tracking-wider uppercase">
              Customer Service
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/orders" className="hover:text-white transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Returns & Replacements
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Shipping Rates & Policies
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Help Center & FAQs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-4 text-xs tracking-wider uppercase">
              About UniCart
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  About Our Marketplace
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Careers & Culture
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  UniCart Wholesale / B2B
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Press Releases
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Sustainability Commitments
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-4 text-xs tracking-wider uppercase">
              Shop
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/deals" className="hover:text-white transition-colors">
                  Today&apos;s Deals
                </Link>
              </li>
              <li>
                <Link to="/search?sort=popular" className="hover:text-white transition-colors">
                  Bestsellers
                </Link>
              </li>
              <li>
                <Link to="/search?sort=newest" className="hover:text-white transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-white transition-colors">
                  My Wishlist
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar & Payment Icons */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl bg-white p-2 shadow-sm">
              <img src="/logo-icon.png" alt="UniCart" className="h-7 w-auto object-contain" />
            </div>
            <div>
              <p className="font-bold text-slate-200">UniCart Internet Private Limited</p>
              <p className="text-slate-400 text-[11px]">
                © {CURRENT_YEAR} UniCart. All rights reserved. Indian Rupee (₹) pricing.
              </p>
            </div>
          </div>

          {/* Payment Badges */}
          <div className="flex items-center gap-3 text-slate-400">
            <span className="text-[11px] font-medium mr-1 text-slate-500">Verified Payment Partners:</span>
            <span className="px-2.5 py-1 bg-slate-800 rounded font-semibold text-[11px] text-emerald-400 border border-slate-700">
              UPI / QR
            </span>
            <span className="px-2.5 py-1 bg-slate-800 rounded font-semibold text-[11px] text-sky-400 border border-slate-700">
              RuPay
            </span>
            <span className="px-2.5 py-1 bg-slate-800 rounded font-semibold text-[11px] text-amber-400 border border-slate-700">
              Visa / MC
            </span>
            <span className="px-2.5 py-1 bg-slate-800 rounded font-semibold text-[11px] text-purple-400 border border-slate-700">
              NetBanking
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
