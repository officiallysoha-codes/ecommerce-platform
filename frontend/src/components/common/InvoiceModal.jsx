import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, ShoppingBag } from 'lucide-react';

export default function InvoiceModal({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200 animate-scaleUp">
        
        {/* Actions Bar (Screen only) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Tax Invoice
            </span>
            <span className="font-mono text-xs font-bold text-slate-800">#{order.order_number}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="space-y-6 text-xs text-slate-700 p-4 border border-slate-200 rounded-2xl bg-white">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                  GZ
                </div>
                <span className="text-xl font-black text-slate-900 tracking-tight">GreenZet</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Hyperlocal Grocery & Multi-Vendor Network</p>
              <p className="text-[10px] text-slate-400">GSTIN: 19AAACG0592E1ZU</p>
            </div>
            <div className="text-right">
              <span className="font-black text-slate-900 text-sm block">ORIGINAL TAX INVOICE</span>
              <p className="font-mono text-slate-500 text-[11px]">Invoice #: INV-{order.order_number}</p>
              <p className="text-slate-400 text-[10px]">Date: {new Date(order.created_at || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Billing & Shipping Grid */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Billed To (Customer):</span>
              <strong className="text-slate-900 text-xs block">{order.delivery_address?.fullName || 'Valued Customer'}</strong>
              <p className="text-slate-500 text-[11px]">{order.delivery_address?.street}, {order.delivery_address?.city}</p>
              <p className="text-slate-500 text-[11px]">PIN: {order.delivery_pincode} • Phone: {order.delivery_address?.phone || '+91 9876543214'}</p>
            </div>

            <div className="text-right">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Sold & Dispatched By:</span>
              <strong className="text-slate-900 text-xs block">{order.store_name || 'Fresh Farm Organics'}</strong>
              <p className="text-slate-500 text-[11px]">Station Road Market, Malda (PIN 732101)</p>
              <p className="text-slate-500 text-[11px]">GST: 19ABCDE1234F1Z5</p>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-[10px] font-bold uppercase text-slate-400">
                <th className="pb-2">Item Description</th>
                <th className="pb-2">Unit</th>
                <th className="pb-2 text-center">Qty</th>
                <th className="pb-2 text-right">Price</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items?.map((it, idx) => (
                <tr key={idx} className="text-xs">
                  <td className="py-2.5 font-semibold text-slate-900">{it.product_title}</td>
                  <td className="py-2.5 text-slate-500">{it.unit}</td>
                  <td className="py-2.5 text-center font-mono">{it.quantity}</td>
                  <td className="py-2.5 text-right font-mono">₹{it.unit_price}</td>
                  <td className="py-2.5 text-right font-mono font-bold">₹{it.total_price}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="pt-3 border-t space-y-1.5 text-xs text-right">
            <div className="flex justify-between">
              <span className="text-slate-500">Gross Subtotal:</span>
              <span className="font-mono">₹{order.total_amount?.toFixed(2)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Coupon Discount Applied:</span>
                <span className="font-mono">-₹{order.discount_amount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Delivery & Packaging Charges:</span>
              <span className="font-mono">{order.delivery_fee === 0 ? 'FREE' : `₹${order.delivery_fee}`}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t">
              <span>Final Paid Amount:</span>
              <span className="text-emerald-700 font-mono">₹{order.final_amount?.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer declaration */}
          <div className="pt-4 border-t flex justify-between items-center text-[10px] text-slate-400">
            <div>
              <p>Payment: <strong className="uppercase text-slate-600">{order.payment_method}</strong> ({order.payment_status})</p>
              <p>Delivery Verification OTP: <strong className="text-slate-600 font-mono">{order.delivery_otp}</strong></p>
            </div>
            <div className="text-right">
              <p>Authorized E-Commerce Invoice</p>
              <p className="font-bold text-slate-600">GreenZet Technologies Pvt. Ltd.</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
