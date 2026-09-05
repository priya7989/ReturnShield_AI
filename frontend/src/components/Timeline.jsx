import React from 'react';
import { CheckCircle2, Clock, Bot, ShieldAlert, Zap } from 'lucide-react';

export const Timeline = ({ caseData }) => {
  const hasEvidence = caseData?.evidence_list && caseData.evidence_list.length > 0;

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
      title: 'AI Multi-Agent Investigation',
      description: 'Vision Agent, Order History Analysis, Policy RAG, & Fraud Risk Scanning',
      status: 'coming_soon',
      icon: Bot,
      isAi: true
    },
    {
      id: 4,
      title: 'Autonomous Decision',
      description: 'System confidence evaluation and auto-approval / escalation',
      status: 'coming_soon',
      icon: ShieldAlert,
      isAi: true
    },
    {
      id: 5,
      title: 'Action Execution',
      description: 'Automated refund trigger, return label generation, or human workflow',
      status: 'coming_soon',
      icon: Zap,
      isAi: true
    }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Investigation Lifecycle Timeline
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time status tracking across manual and future AI agent pipeline stages
          </p>
        </div>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isCompleted = stage.status === 'completed';

          return (
            <div key={stage.id} className="relative flex items-start group">
              {/* Dot / Icon container */}
              <div
                className={`absolute -left-6 top-0 w-7 h-7 rounded-full flex items-center justify-center border text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950 border-slate-700 text-slate-500 opacity-80'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="ml-4 flex-1 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-all">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className={`text-sm font-semibold ${isCompleted ? 'text-slate-100' : 'text-slate-400'}`}>
                    {stage.id}. {stage.title}
                  </h4>
                  {stage.isAi && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-950/80 border border-purple-800/60 text-purple-300">
                      Step 2+ Coming Soon
                    </span>
                  )}
                  {!stage.isAi && isCompleted && (
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">{stage.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;
