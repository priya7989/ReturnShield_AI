import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReturnById, updateReturn } from '../services/api';
import StatusBadge, { RiskBadge } from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import {
  ArrowLeft, User, ShoppingBag, Package, FileText,
  AlertCircle, ShieldCheck, Image as ImageIcon, Calendar, Tag, DollarSign, RefreshCw
} from 'lucide-react';

export const InvestigationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  // Modal / preview image
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchCaseDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReturnById(id);
      setCaseData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch investigation case details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetail();
  }, [id]);

  const handleStatusUpdate = async (newStatus, newRisk, decisionText) => {
    setUpdating(true);
    try {
      const updated = await updateReturn(id, {
        status: newStatus,
        risk_level: newRisk || caseData.risk_level,
        final_decision: decisionText || caseData.final_decision
      });
      setCaseData(updated);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-400">Fetching investigation case records...</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Investigation Case Not Found</h3>
        <p className="text-xs text-slate-400 mb-6">{error || "Requested case does not exist."}</p>
        <button
          onClick={() => navigate('/investigations')}
          className="px-4 py-2 bg-slate-800 text-cyan-400 text-xs font-semibold rounded-xl hover:bg-slate-700"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const { customer, order } = caseData;
  const product = order?.product;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  return (
    <div className="space-y-8">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/investigations')}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white tracking-tight font-mono">
                {caseData.case_number}
              </h2>
              <StatusBadge status={caseData.status} />
              <RiskBadge risk={caseData.risk_level} />
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Created on {new Date(caseData.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Quick Supervisor Override Controls */}
        <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 px-2">Override Status:</span>
          <button
            disabled={updating}
            onClick={() => handleStatusUpdate("Approved", "Low", "Manually Approved by Operations Supervisor")}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold border border-emerald-500/30 transition-all"
          >
            Approve
          </button>
          <button
            disabled={updating}
            onClick={() => handleStatusUpdate("Needs Human Review", "Medium", "Escalated for Secondary Inspection")}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold border border-amber-500/30 transition-all"
          >
            Human Review
          </button>
          <button
            disabled={updating}
            onClick={() => handleStatusUpdate("Rejected", "High", "Rejected by Operations Supervisor")}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold border border-rose-500/30 transition-all"
          >
            Reject
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols wide on desktop): Entity Cards & Complaint */}
        <div className="lg:col-span-2 space-y-6">

          {/* Decision Summary Banner */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">System Determination</h3>
                <p className="text-lg font-extrabold text-white mt-1">
                  {caseData.final_decision || "Pending Autonomous Agent Investigation"}
                </p>
                <div className="mt-3 text-xs text-slate-400 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <span className="font-semibold text-slate-300">Investigation Note: </span>
                  {caseData.status === 'Pending'
                    ? 'Case is queued in database foundation. AI Vision, Fraud, Policy, and Decision Agents will run automatically upon Step 2 activation.'
                    : `Current case status is ${caseData.status} with ${caseData.risk_level} risk level.`}
                </div>
              </div>
            </div>
          </div>

          {/* Customer, Order & Product Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Info */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <User className="w-4 h-4" /> Customer Profile
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-100 text-sm">{customer?.name || 'Unknown'}</h4>
                <p className="text-xs text-slate-400 truncate">{customer?.email || 'N/A'}</p>
                <p className="text-xs text-slate-400">{customer?.phone || 'N/A'}</p>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                Customer ID: #{caseData.customer_id}
              </div>
            </div>

            {/* Order Info */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                <ShoppingBag className="w-4 h-4" /> Order Info
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-cyan-400 font-mono text-sm">{order?.order_number || 'N/A'}</h4>
                <p className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Amount: ${order?.amount?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-slate-400">Status: {order?.status || 'Delivered'}</p>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                Order Date: {order?.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Package className="w-4 h-4" /> Product Details
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-100 text-sm line-clamp-2">{product?.name || 'N/A'}</h4>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-cyan-400" /> {product?.category || 'General'}
                </p>
                <p className="text-xs text-slate-400">Seller: {product?.seller || 'Direct'}</p>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                Warranty: {product?.warranty_period || 'Standard'}
              </div>
            </div>
          </div>

          {/* Customer Complaint Section */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm border-b border-slate-800 pb-3">
              <FileText className="w-5 h-5" />
              Customer Claim & Complaint Details
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Stated Return Reason</p>
              <p className="text-sm font-bold text-rose-300 mt-1">{caseData.reason}</p>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Detailed Complaint Description</p>
              <div className="mt-2 p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs leading-relaxed font-sans">
                "{caseData.description}"
              </div>
            </div>
          </div>

          {/* Evidence Image Gallery */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <ImageIcon className="w-5 h-5" />
                Submitted Evidence Files ({caseData.evidence_list?.length || 0})
              </div>
            </div>

            {caseData.evidence_list && caseData.evidence_list.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {caseData.evidence_list.map((ev) => {
                  const fullUrl = ev.file_path.startswith && ev.file_path.startswith('http')
                    ? ev.file_path
                    : `${API_BASE_URL}${ev.file_path}`;

                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedImage(fullUrl)}
                      className="group cursor-pointer bg-slate-950 border border-slate-800 rounded-xl overflow-hidden hover:border-cyan-500 transition-all shadow-md"
                    >
                      <div className="h-40 bg-slate-950 flex items-center justify-center overflow-hidden relative">
                        <img
                          src={fullUrl}
                          alt={ev.file_name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            // Fallback preview
                            e.target.onerror = null;
                            e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="%230f172a"/><text x="150" y="100" fill="%2338bdf8" text-anchor="middle" font-family="sans-serif">Evidence Image</text></svg>';
                          }}
                        />
                        <div className="absolute inset-0 bg-cyan-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white">
                          Click to View Fullsize
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-900 border-t border-slate-800">
                        <p className="text-[11px] font-semibold text-slate-300 truncate">{ev.file_name}</p>
                        <p className="text-[10px] text-slate-500">
                          Uploaded: {new Date(ev.uploaded_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800/80 text-slate-500 text-xs">
                No visual evidence images uploaded for this claim.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timeline & Future AI Workflow */}
        <div className="space-y-6">
          <Timeline caseData={caseData} />
        </div>
      </div>

      {/* Fullsize Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl overflow-hidden">
            <img src={selectedImage} alt="Fullsize Evidence" className="max-w-full max-h-[80vh] rounded-xl object-contain mx-auto" />
            <div className="p-3 text-center">
              <button
                onClick={() => setSelectedImage(null)}
                className="px-6 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestigationDetail;
