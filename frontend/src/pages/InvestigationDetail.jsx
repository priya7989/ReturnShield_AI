import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReturnById, updateReturn, runInvestigation, getAgentResults, getCustomerMemories } from '../services/api';
import StatusBadge, { RiskBadge } from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import {
  ArrowLeft, User, ShoppingBag, Package, FileText,
  AlertCircle, ShieldCheck, Image as ImageIcon, Calendar, Tag, DollarSign, RefreshCw,
  Sparkles, Bot, CheckCircle2, UserCheck, BookOpen, AlertOctagon, Scale, Check, Database, Brain, ChevronDown, ChevronUp
} from 'lucide-react';

export const InvestigationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [investigationResult, setInvestigationResult] = useState(null);
  const [customerMemories, setCustomerMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [investigating, setInvestigating] = useState(false);
  const [error, setError] = useState(null);

  // RAG Debug accordion toggle
  const [showRagDebug, setShowRagDebug] = useState(false);

  // Modal preview image
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchCaseDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReturnById(id);
      setCaseData(data);

      // Fetch customer persistent memories
      if (data.customer_id) {
        try {
          const memRes = await getCustomerMemories(data.customer_id);
          if (memRes && memRes.memories) {
            setCustomerMemories(memRes.memories);
          }
        } catch (memErr) {
          console.warn("Could not fetch customer memories:", memErr);
        }
      }

      // Attempt to load existing agent results if case was previously investigated
      try {
        const agentLogs = await getAgentResults(id);
        if (agentLogs && agentLogs.results && agentLogs.results.length > 0) {
          const map = {};
          agentLogs.results.forEach((r) => {
            if (r.agent_name === 'OrderAgent') map.order = r.result;
            if (r.agent_name === 'CustomerAgent') map.customer = r.result;
            if (r.agent_name === 'PolicyAgent') map.policy = r.result;
            if (r.agent_name === 'FraudAgent') map.fraud = r.result;
            if (r.agent_name === 'RiskAgent') map.risk = r.result;
            if (r.agent_name === 'DecisionAgent') map.decision = r.result;
          });
          setInvestigationResult(map);
        }
      } catch (logErr) {
        console.warn("Could not fetch historical agent logs:", logErr);
      }

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

  const handleStartInvestigation = async () => {
    setInvestigating(true);
    try {
      const response = await runInvestigation(id);
      if (response && response.result) {
        setInvestigationResult(response.result);
      }
      // Refresh case data & customer memories
      const updatedCase = await getReturnById(id);
      setCaseData(updatedCase);

      if (updatedCase.customer_id) {
        const memRes = await getCustomerMemories(updatedCase.customer_id);
        if (memRes && memRes.memories) {
          setCustomerMemories(memRes.memories);
        }
      }
    } catch (err) {
      console.error("AI Investigation workflow failed:", err);
      alert("Failed to execute AI Investigation workflow. Check backend logs.");
    } finally {
      setInvestigating(false);
    }
  };

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

  const res = investigationResult;
  const policyRes = res?.policy;

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

        {/* Action Controls Header */}
        <div className="flex items-center gap-3">
          <button
            disabled={investigating}
            onClick={handleStartInvestigation}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50"
          >
            {investigating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                LangGraph RAG Investigating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
                Start AI Investigation
              </>
            )}
          </button>

          <div className="hidden md:flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
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
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Decision Summary Banner */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">System Determination</h3>
                <p className="text-lg font-extrabold text-white mt-1">
                  {caseData.final_decision || "Pending AI Agent Investigation"}
                </p>
                <div className="mt-3 text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                  <span className="font-semibold text-cyan-400">Current Status: </span>
                  {caseData.status} | <span className="font-semibold text-amber-400">Risk Level: </span>{caseData.risk_level}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3 POLICY EVIDENCE (RAG RETRIEVAL) WIDGET */}
          {policyRes && (
            <div className="bg-slate-900/90 border border-cyan-900/50 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <BookOpen className="w-5 h-5" />
                  Policy Evidence (ChromaDB Vector RAG)
                </div>
                <span className={`px-2.5 py-0.5 rounded text-xs font-extrabold ${policyRes.eligible ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                  {policyRes.eligible ? '✓ Claim Eligible' : '✕ Ineligible Under Policy'}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Applicable Rule Citation</p>
                <p className="text-sm font-semibold text-slate-100 mt-1">{policyRes.policy_rule}</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{policyRes.reason}</p>
              </div>

              {/* Retrieved RAG Policy Chunks */}
              {policyRes.evidence && policyRes.evidence.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Retrieved Policy Evidence Chunks ({policyRes.evidence.length})
                  </p>
                  <div className="space-y-2">
                    {policyRes.evidence.map((snippet, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                        <div className="flex items-center justify-between text-[10px] text-cyan-400 font-mono mb-1.5 border-b border-slate-800/60 pb-1">
                          <span>Source: {policyRes.sources ? policyRes.sources[0] : 'return_policy.md'}</span>
                          <span>Vector Chunk #{idx + 1}</span>
                        </div>
                        <p className="line-clamp-4">{snippet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RAG Debug Information Accordion */}
              {policyRes.query_used && (
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setShowRagDebug(!showRagDebug)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
                  >
                    <Database className="w-3.5 h-3.5" />
                    RAG Vector Debug Information
                    {showRagDebug ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showRagDebug && (
                    <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                      <p><span className="text-slate-500">Query Formulated:</span> "{policyRes.query_used}"</p>
                      <p><span className="text-slate-500">Vector Collection:</span> return_policy (ChromaDB)</p>
                      <p><span className="text-slate-500">Retrieved Chunks:</span> {policyRes.retrieved_chunks_count || policyRes.evidence?.length || 0}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3 CUSTOMER PERSISTENT MEMORY WIDGET */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Brain className="w-5 h-5" />
                Customer Persistent Memory ({customerMemories.length})
              </div>
              <span className="text-[11px] text-slate-400 font-mono">SQLite Persistent Context</span>
            </div>

            {customerMemories.length > 0 ? (
              <div className="space-y-3">
                {customerMemories.map((mem) => (
                  <div key={mem.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-purple-300 uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-purple-950 border border-purple-800/60">
                        {mem.memory_type}
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        {new Date(mem.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">{mem.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-950/50 rounded-xl border border-slate-800 text-slate-500 text-xs">
                No historical investigation memories recorded for this customer yet. Memories automatically persist after each completed investigation workflow.
              </div>
            )}
          </div>

          {/* STEP 2 LANGGRAPH MULTI-AGENT RESULTS WIDGET */}
          {res ? (
            <div className="bg-slate-900/90 border border-purple-900/50 rounded-2xl p-6 shadow-2xl space-y-6 bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950/20">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-400" />
                    LangGraph Multi-Agent Investigation Report
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Results generated across Order, Customer, Policy (RAG), Fraud, Risk, and Decision agents
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Complete
                </span>
              </div>

              {/* Grid of Agent Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4" /> Order Agent
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {res.order?.order_number || 'N/A'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 space-y-1 pt-1">
                    <p><span className="text-slate-500">Order Found:</span> {res.order?.order_found ? 'Yes' : 'No'}</p>
                    <p><span className="text-slate-500">Delivered:</span> {res.order?.delivered ? 'Yes' : 'No / In Transit'}</p>
                    <p><span className="text-slate-500">Days Since Delivery:</span> {res.order?.days_since_delivery ?? 'N/A'}</p>
                    <p><span className="text-slate-500">Order Amount:</span> ${res.order?.amount?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4" /> Customer Agent
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Ratio: {((res.customer?.return_ratio || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 space-y-1 pt-1">
                    <p><span className="text-slate-500">Total Customer Orders:</span> {res.customer?.total_orders || 0}</p>
                    <p><span className="text-slate-500">Previous Returns:</span> {res.customer?.previous_returns || 0}</p>
                    <p><span className="text-slate-500">Persistent Memories:</span> {res.customer?.persistent_memory_count || 0}</p>
                    <p><span className="text-slate-500">Lifetime Spent:</span> ${res.customer?.total_spent?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> Policy Agent (RAG)
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${res.policy?.eligible ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {res.policy?.eligible ? 'Eligible' : 'Ineligible'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 space-y-1 pt-1">
                    <p className="font-semibold text-slate-200">{res.policy?.policy_rule}</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{res.policy?.reason}</p>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4" /> Fraud Agent
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${res.fraud?.suspicious ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                      {res.fraud?.suspicious ? 'Flagged' : 'Clean'} ({res.fraud?.risk_score || 0}/100)
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 space-y-1 pt-1">
                    {res.fraud?.reasons?.map((reason, idx) => (
                      <p key={idx} className="text-[11px] text-slate-400 flex items-start gap-1">
                        <span className="text-rose-400">•</span> {reason}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Risk & Decision Synthesis Banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-cyan-400" /> Risk Assessment
                    </span>
                    <RiskBadge risk={res.risk?.level || 'LOW'} />
                  </div>
                  <p className="text-xs text-slate-400 font-semibold">Composite Score: {res.risk?.score || 0}/100</p>
                  <div className="space-y-1 pt-1">
                    {res.risk?.factors?.map((f, i) => (
                      <p key={i} className="text-[11px] text-slate-400">• {f}</p>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-purple-400" /> Recommendation
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      {res.decision?.recommendation}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">"{res.decision?.reason}"</p>
                  <p className="text-[10px] text-slate-500">Confidence Score: {((res.decision?.confidence_score || 0) * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl text-center space-y-3">
              <Bot className="w-10 h-10 text-purple-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">AI Multi-Agent Workflow Ready</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Click "Start AI Investigation" above to execute Order, Customer, Policy (RAG), Fraud, Risk, and Decision agents via LangGraph.
              </p>
            </div>
          )}

          {/* Customer, Order & Product Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Right Column: Timeline */}
        <div className="space-y-6">
          <Timeline caseData={caseData} investigationResult={res} />
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
