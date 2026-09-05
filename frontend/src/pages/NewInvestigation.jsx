import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers, getOrders, createReturn, uploadEvidence } from '../services/api';
import { PlusCircle, ArrowLeft, Upload, FileText, User, ShoppingBag, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const NewInvestigation = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [reason, setReason] = useState('Damaged product');
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cList, oList] = await Promise.all([getCustomers(), getOrders()]);
        setCustomers(cList);
        setOrders(oList);
        if (cList.length > 0) {
          setSelectedCustomerId(cList[0].id.toString());
        }
      } catch (err) {
        console.error(err);
        setErrorMessage("Failed to load customer and order list from backend.");
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Filter orders for selected customer
  const filteredOrders = orders.filter(
    (o) => o.customer_id.toString() === selectedCustomerId
  );

  // Set default order when customer changes
  useEffect(() => {
    if (filteredOrders.length > 0) {
      setSelectedOrderId(filteredOrders[0].id.toString());
    } else {
      setSelectedOrderId('');
    }
  }, [selectedCustomerId, orders]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setEvidenceFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedOrderId || !reason || !description.trim()) {
      setErrorMessage("Please complete all required form fields.");
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Create return case
      const payload = {
        customer_id: parseInt(selectedCustomerId, 10),
        order_id: parseInt(selectedOrderId, 10),
        reason: reason,
        description: description
      };

      const createdCase = await createReturn(payload);

      // 2. Upload evidence files if provided
      if (evidenceFiles.length > 0) {
        for (const file of evidenceFiles) {
          await uploadEvidence(createdCase.id, file);
        }
      }

      // 3. Redirect to Investigation details
      navigate(`/investigations/${createdCase.id}`);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.detail || "Failed to create return case. Check server logs.");
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-400">Loading submission form options...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/investigations')}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-cyan-400" />
            File New Return & Refund Investigation
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit customer complaint, order reference, and upload physical evidence photos
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">

        {/* Customer & Order Selection Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Customer Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <User className="w-4 h-4 text-cyan-400" />
              1. Select Customer *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          {/* Order Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-purple-400" />
              2. Select Order *
            </label>
            {filteredOrders.length > 0 ? (
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
              >
                {filteredOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.order_number} — {o.product?.name || 'Product'} (${o.amount.toFixed(2)})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-300 text-xs">
                No delivered orders found for this customer.
              </div>
            )}
          </div>
        </div>

        {/* Return Reason Dropdown */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-rose-400" />
            3. Primary Return Reason *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="Damaged product">Damaged product (Cracked, Broken, Scratched)</option>
            <option value="Defective item">Defective item (Not working / Hardware fault)</option>
            <option value="Wrong item received">Wrong item received (Incorrect size/model)</option>
            <option value="Missing accessories">Missing accessories or components</option>
            <option value="Buyer remorse / Changed mind">Buyer remorse / Changed mind</option>
            <option value="Late delivery">Package arrived too late</option>
            <option value="Other">Other complaint reason</option>
          </select>
        </div>

        {/* Complaint Description Textarea */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            4. Customer Complaint Details *
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter full customer statement, claims, and notes regarding the return..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Evidence File Upload */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-cyan-400" />
            5. Attach Evidence Photos / Documents (Optional)
          </label>
          <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 bg-slate-950/60 text-center hover:border-cyan-500/60 transition-colors relative">
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-300">
              Drag & drop photos here, or <span className="text-cyan-400 underline">browse files</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Supports JPG, PNG, WEBP, SVG, and PDF</p>
          </div>

          {evidenceFiles.length > 0 && (
            <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <p className="text-xs font-bold text-cyan-400 mb-1">Selected Files ({evidenceFiles.length}):</p>
              {evidenceFiles.map((f, idx) => (
                <p key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {f.name} ({(f.size / 1024).toFixed(1)} KB)
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/investigations')}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !selectedOrderId}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting Claim...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                Create Investigation Case
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewInvestigation;
