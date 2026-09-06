import React from 'react';
import { CheckCircle2, Clock, Bot, ShieldAlert, Zap, ShoppingBag, UserCheck, BookOpen, AlertOctagon, Scale, Sparkles } from 'lucide-react';

export const Timeline = ({ caseData, investigationResult }) => {
  const hasEvidence = caseData?.evidence_list && caseData.evidence_list.length > 0;
  const isInvestigated = Boolean(investigationResult && investigationResult.decision);

  const res = investigationResult || {};

  const stages = [
    {
      id: 1,
      title: 'Case Created',
      description: `Return request registered on ${caseData?.created_at ? new Date(caseData.created_at).toLocaleDateString() : 'Submission'}`,
      status: 'completed',
      icon: CheckCircle2,
      isAi: false
    },
    {
      id: 2,
      title: 'Evidence Uploaded',
      description: hasEvidence
        ? `${caseData.evidence_list.length} file(s) attached for investigation`
        : 'No evidence images uploaded at creation',
      status: 'completed',
      icon: CheckCircle2,
      isAi: false
    },
    {
      id: 3,
      title: 'Order Agent',
      description: isInvestigated
        ? `Order verified. Delivered: ${res.order?.delivered ? 'Yes' : 'In Transit / Unconfirmed'}. Days elapsed: ${res.order?.days_since_delivery ?? 'N/A'}.`
        : 'LangGraph Order Agent analysis ready for invocation',
      status: isInvestigated ? 'completed' : 'ready',
      icon: ShoppingBag,
      isAi: true
    },
    {
      id: 4,
      title: 'Customer Agent',
      description: isInvestigated
        ? `Customer history retrieved. Past orders: ${res.customer?.total_orders || 0}, Return ratio: ${((res.customer?.return_ratio || 0) * 100).toFixed(1)}%.`
        : 'LangGraph Customer Agent return ratio scanner',
      status: isInvestigated ? 'completed' : 'ready',
      icon: UserCheck,
      isAi: true
    },
    {
      id: 5,
      title: 'Policy Agent',
      description: isInvestigated
        ? `Policy checked against return_policy.md. Status: ${res.policy?.eligible ? 'Eligible' : 'Ineligible'}. Rule: "${res.policy?.policy_rule}".`
        : 'LangGraph Policy Agent compliance checker',
      status: isInvestigated ? 'completed' : 'ready',
      icon: BookOpen,
      isAi: true
    },
    {
      id: 6,
      title: 'Fraud Agent',
      description: isInvestigated
        ? `Behavioral risk scan complete. Suspicious: ${res.fraud?.suspicious ? 'Yes (Flagged)' : 'No'}. Score: ${res.fraud?.risk_score || 0}/100.`
        : 'LangGraph Fraud Agent pattern detector',
      status: isInvestigated ? 'completed' : 'ready',
      icon: AlertOctagon,
      isAi: true
    },
    {
      id: 7,
      title: 'Risk Agent',
      description: isInvestigated
        ? `Composite Risk Level: ${res.risk?.level || 'MEDIUM'} (Score: ${res.risk?.score || 0}/100).`
        : 'LangGraph Risk Agent composite scoring engine',
      status: isInvestigated ? 'completed' : 'ready',
      icon: Scale,
      isAi: true
    },
    {
      id: 8,
      title: 'Decision Agent',
      description: isInvestigated
        ? `Recommendation: ${res.decision?.recommendation}. Reason: ${res.decision?.reason}`
        : 'LangGraph Decision Agent recommendation engine',
      status: isInvestigated ? 'completed' : 'ready',
      icon: Bot,
      isAi: true
    },
    {
      id: 9,
      title: 'Vision Agent (VLM / Damage Photo AI)',
      description: 'Multimodal image inspection for physical defects & box serial validation',
      status: 'coming_step4',
      icon: Sparkles,
      isAi: true,
      futureTag: 'Coming in Step 4'
    },
    {
      id: 10,
      title: 'Action Execution Agent',
      description: 'Autonomous refund API triggers (Stripe/Shopify) & return shipping label generation',
      status: 'coming_step5',
      icon: Zap,
      isAi: true,
      futureTag: 'Coming in Step 4/5'
    }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Multi-Agent Investigation Timeline
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Step 2 LangGraph agent pipeline execution tracking
          </p>
        </div>
      </div>

      <div className="relative pl-6 space-y-5 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isCompleted = stage.status === 'completed';
          const isReady = stage.status === 'ready';

          return (
            <div key={stage.id} className="relative flex items-start group">
              {/* Dot / Icon container */}
              <div
                className={`absolute -left-6 top-0 w-7 h-7 rounded-full flex items-center justify-center border text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/10'
                    : isReady
                    ? 'bg-purple-950/80 border-purple-600 text-purple-300'
                    : 'bg-slate-950 border-slate-700 text-slate-500 opacity-80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Content */}
              <div className="ml-4 flex-1 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-all">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className={`text-xs font-semibold ${isCompleted ? 'text-slate-100 font-bold' : 'text-slate-300'}`}>
                    {stage.title}
                  </h4>
                  {stage.futureTag ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-400">
                      {stage.futureTag}
                    </span>
                  ) : isCompleted ? (
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Executed
                    </span>
                  ) : (
                    <span className="text-[10px] text-purple-400 font-semibold px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/50">
                      LangGraph Step 2 Agent
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{stage.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;
