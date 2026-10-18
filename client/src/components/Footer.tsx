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
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
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
              <h4 className="text-white font-semibold text-sm">100% Secure Checkout</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                256-bit bank-grade encryption with UPI, RuPay, Visa, and Mastercard support.
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
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Report a Security Issue
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
              Trust & Architecture
            </h5>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              UniCart is engineered with stateless micro-service APIs, Redis caching, Mongo transactional checkout, and OWASP-hardened security protocols.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[11px] font-mono border border-slate-700">
                Argon2id Auth
              </span>
              <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[11px] font-mono border border-slate-700">
                Idempotent Pay
              </span>
              <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[11px] font-mono border border-slate-700">
                OWASP Top 10
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar & Payment Icons */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              <span className="material-symbols-outlined text-lg">shopping_bag</span>
            </div>
            <div>
              <p className="text-slate-300 font-semibold">UniCart Internet Private Limited</p>
              <p className="text-slate-500 text-[11px]">
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
